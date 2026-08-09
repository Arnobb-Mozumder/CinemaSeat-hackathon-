package com.cinemaseat.backend.repository;

import com.cinemaseat.backend.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SeatRepository extends JpaRepository<Seat, String> {
}
