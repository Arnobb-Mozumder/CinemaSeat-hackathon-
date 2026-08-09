package com.cinemaseat.backend.dto;

import java.math.BigDecimal;

public class PaymentRequestDto {
    private String holdId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String paymentMethod;
    private BigDecimal amountUSD;

    public PaymentRequestDto() {}

    public String getHoldId() { return holdId; }
    public void setHoldId(String holdId) { this.holdId = holdId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public BigDecimal getAmountUSD() { return amountUSD; }
    public void setAmountUSD(BigDecimal amountUSD) { this.amountUSD = amountUSD; }
}
