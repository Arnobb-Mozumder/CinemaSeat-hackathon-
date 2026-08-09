package com.cinemaseat.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class HoldResponseDto {
    private String holdId;
    private String showId;
    private List<String> seatIds;
    private String expiresAt;
    private long expiresInSeconds;
    private BigDecimal totalPriceUSD;
    private String status;

    public HoldResponseDto() {}

    public String getHoldId() { return holdId; }
    public void setHoldId(String holdId) { this.holdId = holdId; }

    public String getShowId() { return showId; }
    public void setShowId(String showId) { this.showId = showId; }

    public List<String> getSeatIds() { return seatIds; }
    public void setSeatIds(List<String> seatIds) { this.seatIds = seatIds; }

    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }

    public long getExpiresInSeconds() { return expiresInSeconds; }
    public void setExpiresInSeconds(long expiresInSeconds) { this.expiresInSeconds = expiresInSeconds; }

    public BigDecimal getTotalPriceUSD() { return totalPriceUSD; }
    public void setTotalPriceUSD(BigDecimal totalPriceUSD) { this.totalPriceUSD = totalPriceUSD; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
