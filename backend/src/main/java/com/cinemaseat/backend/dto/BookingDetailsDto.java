package com.cinemaseat.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class BookingDetailsDto {
    private String bookingId;
    private String movieTitle;
    private String moviePosterUrl;
    private String hallName;
    private String showtime;
    private String date;
    private String format;
    private List<String> seats;
    private String seatsFormatted;
    private BigDecimal totalAmountUSD;
    private BigDecimal totalAmountBDT;
    private String status;
    private String createdAt;
    private String paymentRef;

    public BookingDetailsDto() {}

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getMovieTitle() { return movieTitle; }
    public void setMovieTitle(String movieTitle) { this.movieTitle = movieTitle; }

    public String getMoviePosterUrl() { return moviePosterUrl; }
    public void setMoviePosterUrl(String moviePosterUrl) { this.moviePosterUrl = moviePosterUrl; }

    public String getHallName() { return hallName; }
    public void setHallName(String hallName) { this.hallName = hallName; }

    public String getShowtime() { return showtime; }
    public void setShowtime(String showtime) { this.showtime = showtime; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public List<String> getSeats() { return seats; }
    public void setSeats(List<String> seats) { this.seats = seats; }

    public String getSeatsFormatted() { return seatsFormatted; }
    public void setSeatsFormatted(String seatsFormatted) { this.seatsFormatted = seatsFormatted; }

    public BigDecimal getTotalAmountUSD() { return totalAmountUSD; }
    public void setTotalAmountUSD(BigDecimal totalAmountUSD) { this.totalAmountUSD = totalAmountUSD; }

    public BigDecimal getTotalAmountBDT() { return totalAmountBDT; }
    public void setTotalAmountBDT(BigDecimal totalAmountBDT) { this.totalAmountBDT = totalAmountBDT; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getPaymentRef() { return paymentRef; }
    public void setPaymentRef(String paymentRef) { this.paymentRef = paymentRef; }
}
