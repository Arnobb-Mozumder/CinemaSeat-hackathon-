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
@Table(name = "payments")
public class Payment {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hold_id")
    private Hold hold;

    @Column(name = "amount_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountUSD;

    @Column(name = "payment_method", length = 64)
    private String paymentMethod;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "PENDING"; // PENDING, SUCCESSFUL, FAILED

    @Column(name = "transaction_ref", length = 128)
    private String transactionRef;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Payment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public Hold getHold() { return hold; }
    public void setHold(Hold hold) { this.hold = hold; }

    public BigDecimal getAmountUSD() { return amountUSD; }
    public void setAmountUSD(BigDecimal amountUSD) { this.amountUSD = amountUSD; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
