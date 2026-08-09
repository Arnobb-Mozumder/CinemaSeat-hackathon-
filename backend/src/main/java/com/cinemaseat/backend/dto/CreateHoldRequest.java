package com.cinemaseat.backend.dto;

import java.util.List;

public class CreateHoldRequest {
    private String showId;
    private List<String> seatIds;
    private String customerEmail;
    private String customerName;
    private String customerPhone;

    public CreateHoldRequest() {}

    public String getShowId() { return showId; }
    public void setShowId(String showId) { this.showId = showId; }

    public List<String> getSeatIds() { return seatIds; }
    public void setSeatIds(List<String> seatIds) { this.seatIds = seatIds; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
}
