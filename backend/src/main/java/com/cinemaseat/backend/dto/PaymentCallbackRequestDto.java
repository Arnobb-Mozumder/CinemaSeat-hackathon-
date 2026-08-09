package com.cinemaseat.backend.dto;

public class PaymentCallbackRequestDto {
    private String paymentId;
    private String holdId;
    private String status;
    private String transactionRef;

    public PaymentCallbackRequestDto() {}

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getHoldId() { return holdId; }
    public void setHoldId(String holdId) { this.holdId = holdId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
}
