package com.cinemaseat.backend.dto;

import java.math.BigDecimal;

public class ShowDto {
    private String id;
    private String movieId;
    private String hallId;
    private String hallName;
    private String startTime;
    private String date;
    private String format;
    private BigDecimal priceUSD;
    private Integer availableSeatsCount;

    public ShowDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMovieId() { return movieId; }
    public void setMovieId(String movieId) { this.movieId = movieId; }

    public String getHallId() { return hallId; }
    public void setHallId(String hallId) { this.hallId = hallId; }

    public String getHallName() { return hallName; }
    public void setHallName(String hallName) { this.hallName = hallName; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public BigDecimal getPriceUSD() { return priceUSD; }
    public void setPriceUSD(BigDecimal priceUSD) { this.priceUSD = priceUSD; }

    public Integer getAvailableSeatsCount() { return availableSeatsCount; }
    public void setAvailableSeatsCount(Integer availableSeatsCount) { this.availableSeatsCount = availableSeatsCount; }
}
