package com.cinemaseat.backend.controller;

import com.cinemaseat.backend.dto.SeatMapDto;
import com.cinemaseat.backend.dto.ShowDto;
import com.cinemaseat.backend.service.ShowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/shows", "/shows"})
public class ShowController {

    private final ShowService showService;

    public ShowController(ShowService showService) {
        this.showService = showService;
    }

    @GetMapping
    public ResponseEntity<List<ShowDto>> getShows(
            @RequestParam(required = false, name = "movieId") String movieId,
            @RequestParam(required = false, name = "movie_id") String movieIdSnake) {
        String effectiveMovieId = movieId != null ? movieId : movieIdSnake;
        return ResponseEntity.ok(showService.getShows(effectiveMovieId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowDto> getShowById(@PathVariable String id) {
        return ResponseEntity.ok(showService.getShowById(id));
    }

    @GetMapping("/{showId}/seats")
    public ResponseEntity<SeatMapDto> getSeatsForShow(@PathVariable String showId) {
        return ResponseEntity.ok(showService.getSeatsForShow(showId));
    }
}
