package com.cinemaseat.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "seats")
public class Seat {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "seat_row", nullable = false, length = 16)
    private String row;

    @Column(name = "seat_number", nullable = false)
    private Integer number;

    @Column(name = "tier", nullable = false, length = 32)
    private String tier;

    @Column(name = "hall_id", nullable = false, length = 64)
    private String hallId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Seat() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRow() { return row; }
    public void setRow(String row) { this.row = row; }

    public Integer getNumber() { return number; }
    public void setNumber(Integer number) { this.number = number; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public String getHallId() { return hallId; }
    public void setHallId(String hallId) { this.hallId = hallId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
