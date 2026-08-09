package com.cinemaseat.backend.service;

import com.cinemaseat.backend.dto.CreateHoldRequest;
import com.cinemaseat.backend.dto.HoldResponseDto;
import com.cinemaseat.backend.entity.Hold;
import com.cinemaseat.backend.entity.Show;
import com.cinemaseat.backend.entity.ShowSeat;
import com.cinemaseat.backend.exception.ResourceNotFoundException;
import com.cinemaseat.backend.repository.HoldRepository;
import com.cinemaseat.backend.repository.ShowRepository;
import com.cinemaseat.backend.repository.ShowSeatRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class HoldService {

    private final HoldRepository holdRepository;
    private final ShowRepository showRepository;
    private final ShowSeatRepository showSeatRepository;

    @Value("${app.hold-ttl-seconds:120}")
    private long holdTtlSeconds;

    public HoldService(HoldRepository holdRepository, ShowRepository showRepository, ShowSeatRepository showSeatRepository) {
        this.holdRepository = holdRepository;
        this.showRepository = showRepository;
        this.showSeatRepository = showSeatRepository;
    }

    @Transactional
    public HoldResponseDto createHold(CreateHoldRequest request) {
        Show show = showRepository.findById(request.getShowId())
                .orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + request.getShowId()));

        List<ShowSeat> allShowSeats = showSeatRepository.findByShowId(request.getShowId());

        List<ShowSeat> selectedSeats = new ArrayList<>();
        for (String seatIdentifier : request.getSeatIds()) {
            ShowSeat matched = allShowSeats.stream()
                    .filter(ss -> ss.getId().equalsIgnoreCase(seatIdentifier)
                            || ss.getSeat().getId().equalsIgnoreCase(seatIdentifier)
                            || ss.getSeat().getId().endsWith("-" + seatIdentifier))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Seat not found for show: " + seatIdentifier));

            if (!"AVAILABLE".equalsIgnoreCase(matched.getStatus())) {
                throw new IllegalStateException("Seat " + seatIdentifier + " is no longer available (status: " + matched.getStatus() + ")");
            }
            selectedSeats.add(matched);
        }

        BigDecimal totalPrice = selectedSeats.stream()
                .map(ShowSeat::getPriceUSD)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime expiresAt = now.plusSeconds(holdTtlSeconds);

        Hold hold = new Hold();
        hold.setId("hold-" + UUID.randomUUID().toString().substring(0, 8));
        hold.setShow(show);
        hold.setCustomerEmail(request.getCustomerEmail());
        hold.setCustomerName(request.getCustomerName());
        hold.setCustomerPhone(request.getCustomerPhone());
        hold.setStatus("ACTIVE");
        hold.setTotalPriceUSD(totalPrice);
        hold.setExpiresAt(expiresAt);
        hold.setShowSeats(selectedSeats);

        holdRepository.save(hold);

        for (ShowSeat ss : selectedSeats) {
            ss.setStatus("HELD");
            showSeatRepository.save(ss);
        }

        HoldResponseDto response = new HoldResponseDto();
        response.setHoldId(hold.getId());
        response.setShowId(show.getId());
        response.setSeatIds(selectedSeats.stream().map(ss -> ss.getSeat().getId()).collect(Collectors.toList()));
        response.setExpiresAt(expiresAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        response.setExpiresInSeconds(holdTtlSeconds);
        response.setTotalPriceUSD(totalPrice);
        response.setStatus("active");

        return response;
    }

    public HoldResponseDto getHoldById(String holdId) {
        Hold hold = holdRepository.findById(holdId)
                .orElseThrow(() -> new ResourceNotFoundException("Hold not found with id: " + holdId));

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        long remainingSeconds = Math.max(0, hold.getExpiresAt().toEpochSecond() - now.toEpochSecond());

        HoldResponseDto response = new HoldResponseDto();
        response.setHoldId(hold.getId());
        response.setShowId(hold.getShow().getId());
        response.setSeatIds(hold.getShowSeats().stream().map(ss -> ss.getSeat().getId()).collect(Collectors.toList()));
        response.setExpiresAt(hold.getExpiresAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        response.setExpiresInSeconds(remainingSeconds);
        response.setTotalPriceUSD(hold.getTotalPriceUSD());
        response.setStatus(hold.getStatus().toLowerCase());

        return response;
    }
}
