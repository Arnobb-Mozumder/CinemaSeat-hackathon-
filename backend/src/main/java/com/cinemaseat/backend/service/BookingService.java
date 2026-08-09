package com.cinemaseat.backend.service;

import com.cinemaseat.backend.dto.BookingDetailsDto;
import com.cinemaseat.backend.entity.Booking;
import com.cinemaseat.backend.entity.Hold;
import com.cinemaseat.backend.entity.Movie;
import com.cinemaseat.backend.entity.Payment;
import com.cinemaseat.backend.entity.Show;
import com.cinemaseat.backend.entity.ShowSeat;
import com.cinemaseat.backend.exception.ResourceNotFoundException;
import com.cinemaseat.backend.repository.BookingRepository;
import com.cinemaseat.backend.repository.HoldRepository;
import com.cinemaseat.backend.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final HoldRepository holdRepository;
    private final PaymentRepository paymentRepository;

    public BookingService(BookingRepository bookingRepository, HoldRepository holdRepository, PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.holdRepository = holdRepository;
        this.paymentRepository = paymentRepository;
    }

    public BookingDetailsDto getBookingByHoldOrId(String idOrHoldId) {
        Booking booking = bookingRepository.findById(idOrHoldId)
                .or(() -> bookingRepository.findByHoldId(idOrHoldId))
                .or(() -> bookingRepository.findByBookingReference(idOrHoldId))
                .orElse(null);

        if (booking == null) {
            // Check if there is a hold that was just created/converted
            Hold hold = holdRepository.findById(idOrHoldId)
                    .orElseThrow(() -> new ResourceNotFoundException("Booking or Hold not found with id: " + idOrHoldId));

            return convertHoldToBookingDetails(hold);
        }

        return convertToDto(booking);
    }

    private BookingDetailsDto convertToDto(Booking booking) {
        Show show = booking.getShow();
        Movie movie = show != null ? show.getMovie() : null;

        List<ShowSeat> showSeats = booking.getShowSeats();
        if ((showSeats == null || showSeats.isEmpty()) && booking.getHold() != null) {
            showSeats = booking.getHold().getShowSeats();
        }

        List<String> seats = showSeats != null ? showSeats.stream()
                .map(ss -> ss.getSeat().getRow() + ss.getSeat().getNumber())
                .collect(Collectors.toList()) : List.of();

        String seatsFormatted = String.join(", ", seats);

        BigDecimal usd = booking.getTotalAmountUSD();
        BigDecimal bdt = usd != null ? usd.multiply(new BigDecimal("110")) : BigDecimal.ZERO;

        Payment payment = paymentRepository.findByBookingId(booking.getId()).orElse(null);

        BookingDetailsDto dto = new BookingDetailsDto();
        dto.setBookingId(booking.getId());
        dto.setMovieTitle(movie != null ? movie.getTitle() : "Cinema Movie");
        dto.setMoviePosterUrl(movie != null ? movie.getPosterUrl() : "");
        dto.setHallName(show != null ? show.getHallName() : "Theatre");
        dto.setShowtime(show != null ? show.getStartTime() : "19:00");
        dto.setDate(show != null ? show.getShowDate() : "");
        dto.setFormat(show != null ? show.getFormat() : "Standard");
        dto.setSeats(seats);
        dto.setSeatsFormatted(seatsFormatted);
        dto.setTotalAmountUSD(usd);
        dto.setTotalAmountBDT(bdt);
        dto.setStatus(booking.getStatus().toLowerCase());
        dto.setCreatedAt(booking.getCreatedAt() != null ? booking.getCreatedAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : "");
        dto.setPaymentRef(payment != null ? payment.getTransactionRef() : booking.getBookingReference());

        return dto;
    }

    private BookingDetailsDto convertHoldToBookingDetails(Hold hold) {
        Show show = hold.getShow();
        Movie movie = show != null ? show.getMovie() : null;

        List<String> seats = hold.getShowSeats().stream()
                .map(ss -> ss.getSeat().getRow() + ss.getSeat().getNumber())
                .collect(Collectors.toList());

        String seatsFormatted = String.join(", ", seats);

        BigDecimal usd = hold.getTotalPriceUSD();
        BigDecimal bdt = usd != null ? usd.multiply(new BigDecimal("110")) : BigDecimal.ZERO;

        Payment payment = paymentRepository.findByHoldId(hold.getId()).orElse(null);

        BookingDetailsDto dto = new BookingDetailsDto();
        dto.setBookingId(hold.getId());
        dto.setMovieTitle(movie != null ? movie.getTitle() : "Cinema Movie");
        dto.setMoviePosterUrl(movie != null ? movie.getPosterUrl() : "");
        dto.setHallName(show != null ? show.getHallName() : "Theatre");
        dto.setShowtime(show != null ? show.getStartTime() : "19:00");
        dto.setDate(show != null ? show.getShowDate() : "");
        dto.setFormat(show != null ? show.getFormat() : "Standard");
        dto.setSeats(seats);
        dto.setSeatsFormatted(seatsFormatted);
        dto.setTotalAmountUSD(usd);
        dto.setTotalAmountBDT(bdt);
        dto.setStatus("ACTIVE".equalsIgnoreCase(hold.getStatus()) ? "pending" : "confirmed");
        dto.setCreatedAt(hold.getCreatedAt() != null ? hold.getCreatedAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : "");
        dto.setPaymentRef(payment != null ? payment.getTransactionRef() : "REF-" + hold.getId());

        return dto;
    }
}
