package com.cinemaseat.backend.dto;

import java.math.BigDecimal;

public class PaymentResponseDto {
    private String paymentId;
    private String holdId;
    private String bookingId;
    private String status;
    private BigDecimal amountUSD;
    private String createdAt;
    private String transactionRef;

    public PaymentResponseDto() {}

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getHoldId() { return holdId; }
    public void setHoldId(String holdId) { this.holdId = holdId; }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getAmountUSD() { return amountUSD; }
    public void setAmountUSD(BigDecimal amountUSD) { this.amountUSD = amountUSD; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
}
