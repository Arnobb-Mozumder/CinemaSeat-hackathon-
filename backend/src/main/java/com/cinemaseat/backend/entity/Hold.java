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
@Table(name = "holds")
public class Hold {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "ACTIVE"; // ACTIVE, EXPIRED, RELEASED, CONVERTED

    @Column(name = "total_price_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPriceUSD;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToMany
    @JoinTable(
        name = "hold_seats",
        joinColumns = @JoinColumn(name = "hold_id"),
        inverseJoinColumns = @JoinColumn(name = "show_seat_id")
    )
    private List<ShowSeat> showSeats = new ArrayList<>();

    public Hold() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Show getShow() { return show; }
    public void setShow(Show show) { this.show = show; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getTotalPriceUSD() { return totalPriceUSD; }
    public void setTotalPriceUSD(BigDecimal totalPriceUSD) { this.totalPriceUSD = totalPriceUSD; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public List<ShowSeat> getShowSeats() { return showSeats; }
    public void setShowSeats(List<ShowSeat> showSeats) { this.showSeats = showSeats; }
}
