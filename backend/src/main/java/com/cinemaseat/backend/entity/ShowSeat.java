package com.cinemaseat.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "show_seats")
public class ShowSeat {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "AVAILABLE"; // AVAILABLE, HELD, BOOKED

    @Column(name = "price_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceUSD;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public ShowSeat() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Show getShow() { return show; }
    public void setShow(Show show) { this.show = show; }

    public Seat getSeat() { return seat; }
    public void setSeat(Seat seat) { this.seat = seat; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getPriceUSD() { return priceUSD; }
    public void setPriceUSD(BigDecimal priceUSD) { this.priceUSD = priceUSD; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
