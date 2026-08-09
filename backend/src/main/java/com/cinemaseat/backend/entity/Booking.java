package com.cinemaseat.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hold_id")
    private Hold hold;

    @Column(name = "booking_reference", nullable = false, unique = true, length = 64)
    private String bookingReference;

    @Column(name = "total_amount_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmountUSD;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToMany
    @JoinTable(
        name = "booking_seats",
        joinColumns = @JoinColumn(name = "booking_id"),
        inverseJoinColumns = @JoinColumn(name = "show_seat_id")
    )
    private List<ShowSeat> showSeats = new ArrayList<>();

    public Booking() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Show getShow() { return show; }
    public void setShow(Show show) { this.show = show; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public Hold getHold() { return hold; }
    public void setHold(Hold hold) { this.hold = hold; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }

    public BigDecimal getTotalAmountUSD() { return totalAmountUSD; }
    public void setTotalAmountUSD(BigDecimal totalAmountUSD) { this.totalAmountUSD = totalAmountUSD; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public List<ShowSeat> getShowSeats() { return showSeats; }
    public void setShowSeats(List<ShowSeat> showSeats) { this.showSeats = showSeats; }
}
