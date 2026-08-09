package com.cinemaseat.backend.controller;

import com.cinemaseat.backend.dto.CreateHoldRequest;
import com.cinemaseat.backend.dto.HoldResponseDto;
import com.cinemaseat.backend.service.HoldService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/holds", "/holds"})
public class HoldController {

    private final HoldService holdService;

    public HoldController(HoldService holdService) {
        this.holdService = holdService;
    }

    @PostMapping
    public ResponseEntity<HoldResponseDto> createHold(@RequestBody CreateHoldRequest request) {
        return ResponseEntity.ok(holdService.createHold(request));
    }

    @GetMapping("/{holdId}")
    public ResponseEntity<HoldResponseDto> getHoldById(@PathVariable String holdId) {
        return ResponseEntity.ok(holdService.getHoldById(holdId));
    }
}
