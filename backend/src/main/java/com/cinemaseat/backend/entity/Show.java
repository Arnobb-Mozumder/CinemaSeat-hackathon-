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
@Table(name = "shows")
public class Show {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @Column(name = "hall_id", nullable = false, length = 64)
    private String hallId;

    @Column(name = "hall_name", nullable = false)
    private String hallName;

    @Column(name = "start_time", nullable = false, length = 16)
    private String startTime;

    @Column(name = "show_date", nullable = false, length = 16)
    private String showDate;

    @Column(name = "format", nullable = false, length = 64)
    private String format;

    @Column(name = "base_price_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePriceUSD;

    @Column(name = "available_seats_count", nullable = false)
    private Integer availableSeatsCount = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Show() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Movie getMovie() { return movie; }
    public void setMovie(Movie movie) { this.movie = movie; }

    public String getHallId() { return hallId; }
    public void setHallId(String hallId) { this.hallId = hallId; }

    public String getHallName() { return hallName; }
    public void setHallName(String hallName) { this.hallName = hallName; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getShowDate() { return showDate; }
    public void setShowDate(String showDate) { this.showDate = showDate; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public BigDecimal getBasePriceUSD() { return basePriceUSD; }
    public void setBasePriceUSD(BigDecimal basePriceUSD) { this.basePriceUSD = basePriceUSD; }

    public Integer getAvailableSeatsCount() { return availableSeatsCount; }
    public void setAvailableSeatsCount(Integer availableSeatsCount) { this.availableSeatsCount = availableSeatsCount; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
