package com.cinemaseat.backend.service;

import com.cinemaseat.backend.dto.MovieDto;
import com.cinemaseat.backend.entity.Movie;
import com.cinemaseat.backend.exception.ResourceNotFoundException;
import com.cinemaseat.backend.repository.MovieRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MovieService {

    private final MovieRepository movieRepository;

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public List<MovieDto> getAllMovies() {
        return movieRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public MovieDto getMovieById(String id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));
        return convertToDto(movie);
    }

    private MovieDto convertToDto(Movie movie) {
        MovieDto dto = new MovieDto();
        dto.setId(movie.getId());
        dto.setTitle(movie.getTitle());
        dto.setTagline(movie.getTagline());
        dto.setSynopsis(movie.getSynopsis());
        dto.setDurationMinutes(movie.getDurationMinutes());
        dto.setReleaseYear(movie.getReleaseYear());
        dto.setRating(movie.getRating());
        dto.setAgeRating(movie.getAgeRating());
        
        if (movie.getGenres() != null && !movie.getGenres().trim().isEmpty()) {
            dto.setGenres(Arrays.stream(movie.getGenres().split(","))
                    .map(String::trim)
                    .collect(Collectors.toList()));
        } else {
            dto.setGenres(Collections.emptyList());
        }

        dto.setPosterUrl(movie.getPosterUrl());
        dto.setBannerUrl(movie.getBannerUrl());
        dto.setDirector(movie.getDirector());

        if (movie.getCastMembers() != null && !movie.getCastMembers().trim().isEmpty()) {
            dto.setCast(Arrays.stream(movie.getCastMembers().split(","))
                    .map(String::trim)
                    .collect(Collectors.toList()));
        } else {
            dto.setCast(Collections.emptyList());
        }

        dto.setIsFeatured(movie.getIsFeatured());
        return dto;
    }
}
