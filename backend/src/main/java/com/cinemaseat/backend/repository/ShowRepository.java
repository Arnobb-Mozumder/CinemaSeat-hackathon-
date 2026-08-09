package com.cinemaseat.backend.repository;

import com.cinemaseat.backend.entity.Show;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShowRepository extends JpaRepository<Show, String> {
    List<Show> findByMovieId(String movieId);
}
