package com.cinemaseat.backend.service;

import com.cinemaseat.backend.dto.SeatMapDto;
import com.cinemaseat.backend.dto.ShowDto;
import com.cinemaseat.backend.entity.Show;
import com.cinemaseat.backend.entity.ShowSeat;
import com.cinemaseat.backend.exception.ResourceNotFoundException;
import com.cinemaseat.backend.repository.ShowRepository;
import com.cinemaseat.backend.repository.ShowSeatRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShowService {

    private final ShowRepository showRepository;
    private final ShowSeatRepository showSeatRepository;

    public ShowService(ShowRepository showRepository, ShowSeatRepository showSeatRepository) {
        this.showRepository = showRepository;
        this.showSeatRepository = showSeatRepository;
    }

    public List<ShowDto> getShows(String movieId) {
        List<Show> shows;
        if (movieId != null && !movieId.trim().isEmpty()) {
            shows = showRepository.findByMovieId(movieId);
        } else {
            shows = showRepository.findAll();
        }
        return shows.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public ShowDto getShowById(String id) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
        return convertToDto(show);
    }

    public SeatMapDto getSeatsForShow(String showId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + showId));

        List<ShowSeat> showSeats = showSeatRepository.findByShowId(showId);

        SeatMapDto.ShowDetailsDto showDetails = new SeatMapDto.ShowDetailsDto();
        showDetails.setId(show.getId());
        showDetails.setMovieId(show.getMovie().getId());
        showDetails.setHallName(show.getHallName());
        showDetails.setFormat(show.getFormat());
        showDetails.setStartTime(show.getStartTime());
        showDetails.setDate(show.getShowDate());
        showDetails.setPriceUsd(show.getBasePriceUSD());

        List<SeatMapDto.ShowSeatDto> seatDtos = showSeats.stream().map(ss -> {
            SeatMapDto.ShowSeatDto dto = new SeatMapDto.ShowSeatDto();
            dto.setId(ss.getId());
            dto.setSeatId(ss.getSeat().getId());
            dto.setRowLabel(ss.getSeat().getRow());
            dto.setColLabel(ss.getSeat().getNumber());
            dto.setStatus(ss.getStatus().toLowerCase());
            dto.setPriceUsd(ss.getPriceUSD());
            return dto;
        }).collect(Collectors.toList());

        List<String> rows = Arrays.asList("A", "B", "C", "D", "E", "F");
        Integer seatsPerRow = 12;

        return new SeatMapDto(showDetails, seatDtos, rows, seatsPerRow);
    }

    private ShowDto convertToDto(Show show) {
        ShowDto dto = new ShowDto();
        dto.setId(show.getId());
        if (show.getMovie() != null) {
            dto.setMovieId(show.getMovie().getId());
        }
        dto.setHallId(show.getHallId());
        dto.setHallName(show.getHallName());
        dto.setStartTime(show.getStartTime());
        dto.setDate(show.getShowDate());
        dto.setFormat(show.getFormat());
        dto.setPriceUSD(show.getBasePriceUSD());
        dto.setAvailableSeatsCount(show.getAvailableSeatsCount());
        return dto;
    }
}
