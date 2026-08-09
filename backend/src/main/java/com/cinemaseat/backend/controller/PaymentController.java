package com.cinemaseat.backend.controller;

import com.cinemaseat.backend.dto.PaymentCallbackRequestDto;
import com.cinemaseat.backend.dto.PaymentRequestDto;
import com.cinemaseat.backend.dto.PaymentResponseDto;
import com.cinemaseat.backend.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/payments", "/payments"})
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponseDto> processPayment(@RequestBody PaymentRequestDto request) {
        return ResponseEntity.ok(paymentService.processPayment(request));
    }

    @PostMapping("/callback")
    public ResponseEntity<PaymentResponseDto> processCallback(@RequestBody PaymentCallbackRequestDto callback) {
        return ResponseEntity.ok(paymentService.processCallback(callback));
    }
}
