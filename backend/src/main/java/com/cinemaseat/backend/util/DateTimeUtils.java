package com.cinemaseat.backend.util;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public class DateTimeUtils {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT;

    public static String formatIso(Instant instant) {
        if (instant == null) return null;
        return ISO_FORMATTER.format(instant);
    }

    public static Instant nowUtc() {
        return Instant.now().atZone(ZoneOffset.UTC).toInstant();
    }
}
