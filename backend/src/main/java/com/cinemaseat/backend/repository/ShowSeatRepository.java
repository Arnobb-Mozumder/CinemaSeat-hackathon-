package com.cinemaseat.backend.repository;

import com.cinemaseat.backend.entity.ShowSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShowSeatRepository extends JpaRepository<ShowSeat, String> {
    List<ShowSeat> findByShowId(String showId);
}
