package com.cinemaseat.backend.service;

import com.cinemaseat.backend.dto.PaymentCallbackRequestDto;
import com.cinemaseat.backend.dto.PaymentRequestDto;
import com.cinemaseat.backend.dto.PaymentResponseDto;
import com.cinemaseat.backend.entity.Booking;
import com.cinemaseat.backend.entity.Customer;
import com.cinemaseat.backend.entity.Hold;
import com.cinemaseat.backend.entity.Payment;
import com.cinemaseat.backend.entity.PaymentEvent;
import com.cinemaseat.backend.entity.Show;
import com.cinemaseat.backend.entity.ShowSeat;
import com.cinemaseat.backend.exception.ResourceNotFoundException;
import com.cinemaseat.backend.repository.BookingRepository;
import com.cinemaseat.backend.repository.CustomerRepository;
import com.cinemaseat.backend.repository.HoldRepository;
import com.cinemaseat.backend.repository.PaymentEventRepository;
import com.cinemaseat.backend.repository.PaymentRepository;
import com.cinemaseat.backend.repository.ShowRepository;
import com.cinemaseat.backend.repository.ShowSeatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class PaymentService {

    private final HoldRepository holdRepository;
    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentEventRepository paymentEventRepository;
    private final ShowSeatRepository showSeatRepository;
    private final ShowRepository showRepository;

    public PaymentService(HoldRepository holdRepository,
                          CustomerRepository customerRepository,
                          BookingRepository bookingRepository,
                          PaymentRepository paymentRepository,
                          PaymentEventRepository paymentEventRepository,
                          ShowSeatRepository showSeatRepository,
                          ShowRepository showRepository) {
        this.holdRepository = holdRepository;
        this.customerRepository = customerRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.paymentEventRepository = paymentEventRepository;
        this.showSeatRepository = showSeatRepository;
        this.showRepository = showRepository;
    }

    @Transactional
    public PaymentResponseDto processPayment(PaymentRequestDto request) {
        Hold hold = holdRepository.findById(request.getHoldId())
                .orElseThrow(() -> new ResourceNotFoundException("Hold not found with id: " + request.getHoldId()));

        String email = request.getCustomerEmail() != null ? request.getCustomerEmail() : hold.getCustomerEmail();
        String name = request.getCustomerName() != null ? request.getCustomerName() : hold.getCustomerName();
        String phone = request.getCustomerPhone() != null ? request.getCustomerPhone() : hold.getCustomerPhone();

        Customer customer = null;
        if (email != null && !email.trim().isEmpty()) {
            customer = customerRepository.findByEmail(email).orElseGet(() -> {
                Customer newCust = new Customer();
                newCust.setId("cust-" + UUID.randomUUID().toString().substring(0, 8));
                newCust.setEmail(email);
                newCust.setFullName(name != null ? name : "Cinema Guest");
                newCust.setPhone(phone);
                return customerRepository.save(newCust);
            });
        }

        Booking booking = new Booking();
        booking.setId("bk-" + UUID.randomUUID().toString().substring(0, 8));
        booking.setBookingReference("REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setShow(hold.getShow());
        booking.setCustomer(customer);
        booking.setHold(hold);
        booking.setTotalAmountUSD(request.getAmountUSD() != null ? request.getAmountUSD() : hold.getTotalPriceUSD());
        booking.setStatus("CONFIRMED");
        booking.setShowSeats(hold.getShowSeats());

        bookingRepository.save(booking);

        hold.setStatus("CONVERTED");
        holdRepository.save(hold);

        for (ShowSeat ss : hold.getShowSeats()) {
            ss.setStatus("BOOKED");
            showSeatRepository.save(ss);
        }

        Show show = hold.getShow();
        if (show != null && show.getAvailableSeatsCount() != null) {
            int newAvailable = Math.max(0, show.getAvailableSeatsCount() - hold.getShowSeats().size());
            show.setAvailableSeatsCount(newAvailable);
            showRepository.save(show);
        }

        Payment payment = new Payment();
        payment.setId("pay-" + UUID.randomUUID().toString().substring(0, 8));
        payment.setBooking(booking);
        payment.setHold(hold);
        payment.setAmountUSD(booking.getTotalAmountUSD());
        payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CARD");
        payment.setStatus("SUCCESSFUL");
        payment.setTransactionRef("TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());

        paymentRepository.save(payment);

        PaymentEvent event = new PaymentEvent();
        event.setId("pe-" + UUID.randomUUID().toString().substring(0, 8));
        event.setPayment(payment);
        event.setEventType("PAYMENT_SUCCESSFUL");
        event.setPayload("Payment of " + payment.getAmountUSD() + " USD completed successfully for booking " + booking.getId());

        paymentEventRepository.save(event);

        PaymentResponseDto response = new PaymentResponseDto();
        response.setPaymentId(payment.getId());
        response.setHoldId(hold.getId());
        response.setBookingId(booking.getId());
        response.setStatus("successful");
        response.setAmountUSD(payment.getAmountUSD());
        response.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        response.setTransactionRef(payment.getTransactionRef());

        return response;
    }

    @Transactional
    public PaymentResponseDto processCallback(PaymentCallbackRequestDto callback) {
        String paymentId = callback.getPaymentId();
        Payment payment = null;
        if (paymentId != null) {
            payment = paymentRepository.findById(paymentId).orElse(null);
        }
        if (payment == null && callback.getHoldId() != null) {
            payment = paymentRepository.findByHoldId(callback.getHoldId()).orElse(null);
        }

        if (payment != null) {
            if (callback.getStatus() != null) {
                payment.setStatus(callback.getStatus().toUpperCase());
            }
            if (callback.getTransactionRef() != null) {
                payment.setTransactionRef(callback.getTransactionRef());
            }
            paymentRepository.save(payment);

            PaymentResponseDto response = new PaymentResponseDto();
            response.setPaymentId(payment.getId());
            response.setHoldId(payment.getHold() != null ? payment.getHold().getId() : "");
            response.setBookingId(payment.getBooking() != null ? payment.getBooking().getId() : "");
            response.setStatus(payment.getStatus().toLowerCase());
            response.setAmountUSD(payment.getAmountUSD());
            response.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
            response.setTransactionRef(payment.getTransactionRef());

            return response;
        }

        PaymentResponseDto response = new PaymentResponseDto();
        response.setPaymentId(paymentId != null ? paymentId : "pay-cb");
        response.setHoldId(callback.getHoldId());
        response.setStatus("successful");
        response.setTransactionRef(callback.getTransactionRef() != null ? callback.getTransactionRef() : "TXN-CB");
        return response;
    }
}
