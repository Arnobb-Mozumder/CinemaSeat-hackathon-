package com.cinemaseat.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class SeatMapDto {
    private ShowDetailsDto show;
    private List<ShowSeatDto> seats;
    private List<String> rows;
    private Integer seatsPerRow;

    public SeatMapDto() {}

    public SeatMapDto(ShowDetailsDto show, List<ShowSeatDto> seats, List<String> rows, Integer seatsPerRow) {
        this.show = show;
        this.seats = seats;
        this.rows = rows;
        this.seatsPerRow = seatsPerRow;
    }

    public ShowDetailsDto getShow() { return show; }
    public void setShow(ShowDetailsDto show) { this.show = show; }

    public List<ShowSeatDto> getSeats() { return seats; }
    public void setSeats(List<ShowSeatDto> seats) { this.seats = seats; }

    public List<String> getRows() { return rows; }
    public void setRows(List<String> rows) { this.rows = rows; }

    public Integer getSeatsPerRow() { return seatsPerRow; }
    public void setSeatsPerRow(Integer seatsPerRow) { this.seatsPerRow = seatsPerRow; }

    public static class ShowDetailsDto {
        private String id;
        private String movieId;
        private String hallName;
        private String format;
        private String startTime;
        private String date;
        private BigDecimal priceUsd;

        public ShowDetailsDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getMovieId() { return movieId; }
        public void setMovieId(String movieId) { this.movieId = movieId; }

        public String getHallName() { return hallName; }
        public void setHallName(String hallName) { this.hallName = hallName; }

        public String getFormat() { return format; }
        public void setFormat(String format) { this.format = format; }

        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public BigDecimal getPriceUsd() { return priceUsd; }
        public void setPriceUsd(BigDecimal priceUsd) { this.priceUsd = priceUsd; }
    }

    public static class ShowSeatDto {
        private String id;
        private String seatId;
        private String rowLabel;
        private Integer colLabel;
        private String status;
        private BigDecimal priceUsd;

        public ShowSeatDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getSeatId() { return seatId; }
        public void setSeatId(String seatId) { this.seatId = seatId; }

        public String getRowLabel() { return rowLabel; }
        public void setRowLabel(String rowLabel) { this.rowLabel = rowLabel; }

        public Integer getColLabel() { return colLabel; }
        public void setColLabel(Integer colLabel) { this.colLabel = colLabel; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public BigDecimal getPriceUsd() { return priceUsd; }
        public void setPriceUsd(BigDecimal priceUsd) { this.priceUsd = priceUsd; }
    }
}
