package com.cinemaseat.backend.controller;

import com.cinemaseat.backend.dto.BookingDetailsDto;
import com.cinemaseat.backend.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/bookings", "/bookings"})
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/{idOrHoldId}")
    public ResponseEntity<BookingDetailsDto> getBooking(@PathVariable String idOrHoldId) {
        return ResponseEntity.ok(bookingService.getBookingByHoldOrId(idOrHoldId));
    }

    @GetMapping("/{idOrHoldId}/ticket")
    public ResponseEntity<BookingDetailsDto> getTicket(@PathVariable String idOrHoldId) {
        return ResponseEntity.ok(bookingService.getBookingByHoldOrId(idOrHoldId));
    }
}
