// CinemaSeat Comprehensive Local Test Suite (Phases 1 - 32)
// Runs 23 test scenarios against local server at http://127.0.0.1:3000

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

function logResult(num, name, passed, details = '') {
  const statusStr = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[Test ${String(num).padStart(2, '0')}] ${statusStr} - ${name}${details ? ` (${details})` : ''}`);
  if (!passed) {
    throw new Error(`Test ${num} failed: ${name}`);
  }
}

async function runLocalTestSuite() {
  console.log('\n============================================================');
  console.log('         CINEMASEAT LOCAL TEST SUITE (23 TESTS)');
  console.log('============================================================\n');

  // Reset state before running test suite
  await fetch(`${BASE_URL}/api/test/reset`, { method: 'POST' });

  const showId = 'st-sm2d-1';

  const safeJson = async (res, tag) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error(`JSON Parse Error in [${tag}]: HTTP ${res.status}, body: "${text}"`);
      throw err;
    }
  };

  // 1. Health Endpoint
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  logResult(1, 'Health Endpoint', healthRes.status === 200 && healthData.status === 'ok', `status: ${healthData.status}`);

  // 2. Movie Retrieval
  const moviesRes = await fetch(`${BASE_URL}/api/movies`);
  const movies = await moviesRes.json();
  logResult(2, 'Movie Retrieval', moviesRes.status === 200 && Array.isArray(movies) && movies.length >= 4, `found ${movies.length} movies`);

  // 3. Show Retrieval
  const showsRes = await fetch(`${BASE_URL}/api/shows?movieId=m-spiderman-2d`);
  const shows = await showsRes.json();
  logResult(3, 'Show Retrieval', showsRes.status === 200 && Array.isArray(shows) && shows.length > 0, `found ${shows.length} shows`);

  // Helper to get fresh available seats
  const getFreshSeats = async () => {
    const res = await fetch(`${BASE_URL}/api/shows/${showId}/seats`);
    const data = await res.json();
    return data.seats.filter((s) => s.status === 'available').map((s) => s.seatId || s.id);
  };

  // 4. Seat Retrieval
  const seats4 = await getFreshSeats();
  logResult(4, 'Seat Retrieval', seats4.length > 0, `${seats4.length} available seats`);

  // 5. Normal Hold
  const seats5 = await getFreshSeats();
  const h1Res = await fetch(`${BASE_URL}/api/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'client-test-01' },
    body: JSON.stringify({ showId, seatIds: [seats5[0]] }),
  });
  const h1 = await h1Res.json();
  if (h1Res.status !== 201) console.log('DEBUG Test 5 fail details:', h1Res.status, h1);
  logResult(5, 'Normal Hold', h1Res.status === 201 && h1.status === 'active', `holdId: ${h1.holdId}`);

  // 6. Same Seat Twice Collision
  const h2Res = await fetch(`${BASE_URL}/api/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'client-test-02' },
    body: JSON.stringify({ showId, seatIds: [seats5[0]] }),
  });
  logResult(6, 'Same Seat Twice Collision', h2Res.status === 409, `HTTP ${h2Res.status}`);

  // 7. Multi-Seat Atomicity
  const multiRes = await fetch(`${BASE_URL}/api/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'client-test-03' },
    body: JSON.stringify({ showId, seatIds: [seats5[0], seats5[1]] }),
  });
  logResult(7, 'Multi-Seat Atomicity', multiRes.status === 409, `Rejected because seat 0 is held (HTTP ${multiRes.status})`);

  // 8. 100 Concurrent Requests for Same Seat
  const seats8 = await getFreshSeats();
  const concSeat = seats8[0];
  const concReqs = Array.from({ length: 100 }, (_, i) =>
    fetch(`${BASE_URL}/api/holds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-ID': `conc-user-${i}` },
      body: JSON.stringify({ showId, seatIds: [concSeat] }),
    })
  );
  const concResList = await Promise.all(concReqs);
  const concStatuses = concResList.map((r) => r.status);
  const concSuccess = concStatuses.filter((s) => s === 201).length;
  const concConflict = concStatuses.filter((s) => s === 409).length;
  logResult(8, '100 Concurrent Requests Atomicity', concSuccess === 1 && concConflict === 99, `Success: ${concSuccess}, Conflicts: ${concConflict}`);

  // 9. Parallel Overlapping Holds
  const seats9 = await getFreshSeats();
  const parallelReqs = [
    fetch(`${BASE_URL}/api/holds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'p-user-1' },
      body: JSON.stringify({ showId, seatIds: [seats9[0], seats9[1]] }),
    }),
    fetch(`${BASE_URL}/api/holds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'p-user-2' },
      body: JSON.stringify({ showId, seatIds: [seats9[1], seats9[2]] }),
    }),
  ];
  const parallelRes = await Promise.all(parallelReqs);
  const pStatuses = parallelRes.map((r) => r.status);
  const pSuccessCount = pStatuses.filter((s) => s === 201).length;
  const pConflictCount = pStatuses.filter((s) => s === 409).length;
  logResult(9, 'Parallel Overlapping Holds', pSuccessCount === 1 && pConflictCount === 1, `1 succeeded, 1 conflicted as expected`);

  // 10. Hold Expiry
  const seats10 = await getFreshSeats();
  const hExpiryRes = await fetch(`${BASE_URL}/api/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'expire-client' },
    body: JSON.stringify({ showId, seatIds: [seats10[0]] }),
  });
  const hExpiryData = await hExpiryRes.json();
  const expireRes = await fetch(`${BASE_URL}/api/test/expire-hold/${hExpiryData.holdId}`, { method: 'POST' });
  const expireData = await expireRes.json();
  logResult(10, 'Hold Expiry', expireRes.status === 200 && expireData.hold.status === 'expired', `status: ${expireData.hold.status}`);

  // 11. Expired Seat Reuse & Explicit Hold Release
  const releaseHoldTestRes = await fetch(`${BASE_URL}/api/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'release-client' },
    body: JSON.stringify({ showId, seatIds: [seats10[0]] }),
  });
  const releaseHoldTestData = await releaseHoldTestRes.json();
  const deleteRes = await fetch(`${BASE_URL}/api/holds/${releaseHoldTestData.holdId}`, { method: 'DELETE' });
  const deleteData = await deleteRes.json();
  logResult(11, 'Explicit Hold Release & Reuse', deleteRes.status === 200 && deleteData.status === 'released', `Released hold ${releaseHoldTestData.holdId}`);

  // 12. Active Hold Limit Per IP / Client
  const limitClient = 'active-limit-client';
  const seats12 = await getFreshSeats();
  await fetch(`${BASE_URL}/api/holds`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-ID': limitClient }, body: JSON.stringify({ showId, seatIds: [seats12[0]] }) });
  await fetch(`${BASE_URL}/api/holds`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-ID': limitClient }, body: JSON.stringify({ showId, seatIds: [seats12[1]] }) });
  await fetch(`${BASE_URL}/api/holds`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-ID': limitClient }, body: JSON.stringify({ showId, seatIds: [seats12[2]] }) });
  const overflowHoldRes = await fetch(`${BASE_URL}/api/holds`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-ID': limitClient }, body: JSON.stringify({ showId, seatIds: [seats12[3]] }) });
  logResult(12, 'Active Hold Limit Enforcement', overflowHoldRes.status === 429, `HTTP ${overflowHoldRes.status} Active hold limit exceeded`);

  // 13. Rate Limiting
  const rateClient = 'rate-limit-client';
  const seats13 = await getFreshSeats();
  let rate429Count = 0;
  for (let i = 0; i < 12; i++) {
    const r = await fetch(`${BASE_URL}/api/holds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-ID': rateClient },
      body: JSON.stringify({ showId, seatIds: [seats13[i % seats13.length]] }),
    });
    if (r.status === 429) rate429Count++;
  }
  logResult(13, 'Rate Limiting Enforcement', rate429Count > 0, `Caught ${rate429Count} rate-limited requests`);

  // 14. Customer Creation
  const custRes = await fetch(`${BASE_URL}/api/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Jane Doe', email: 'jane.doe@example.com', phone: '+1234567890' }),
  });
  const custData = await safeJson(custRes, 'Test 14 Customer');
  logResult(14, 'Customer Creation', custRes.status === 201 && !!custData.id, `customerId: ${custData.id}`);

  // 15. Payment Creation
  const seats15 = await getFreshSeats();
  const payHoldRes = await fetch(`${BASE_URL}/api/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'pay-client-1' },
    body: JSON.stringify({ showId, seatIds: [seats15[0]] }),
  });
  const payHold = await safeJson(payHoldRes, 'Test 15 Hold');
  const payRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holdId: payHold.holdId, amountUSD: 450, name: 'Jane Doe', email: 'jane.doe@example.com' }),
  });
  const payData = await safeJson(payRes, 'Test 15 Payment');
  logResult(15, 'Payment Creation', payRes.status === 202 && !!payData.paymentId, `paymentId: ${payData.paymentId}`);

  // 16. Payment Success
  await new Promise((r) => setTimeout(r, 900));
  const pollSuccessRes = await fetch(`${BASE_URL}/api/bookings/${payHold.holdId}`);
  const pollSuccessData = await safeJson(pollSuccessRes, 'Test 16 Poll');
  logResult(16, 'Payment Success Processing', pollSuccessData.status === 'confirmed', `status: ${pollSuccessData.status}`);

  // 17. Payment Failure (X-Mock-Force: fail)
  const seats17 = await getFreshSeats();
  const failHoldRes = await fetch(`${BASE_URL}/api/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'fail-client' },
    body: JSON.stringify({ showId, seatIds: [seats17[0]] }),
  });
  const failHold = await safeJson(failHoldRes, 'Test 17 Hold');
  const failPayRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Mock-Force': 'fail' },
    body: JSON.stringify({ holdId: failHold.holdId, amountUSD: 450 }),
  });
  const failPayData = await safeJson(failPayRes, 'Test 17 Payment');
  logResult(17, 'Payment Failure via X-Mock-Force', failPayData.status === 'failed', `status: ${failPayData.status}`);

  // 18. Payment Timeout (X-Mock-Force: timeout)
  const seats18 = await getFreshSeats();
  const timeHoldRes = await fetch(`${BASE_URL}/api/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'timeout-client' },
    body: JSON.stringify({ showId, seatIds: [seats18[0]] }),
  });
  const timeHold = await safeJson(timeHoldRes, 'Test 18 Hold');
  const timePayRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Mock-Force': 'timeout' },
    body: JSON.stringify({ holdId: timeHold.holdId, amountUSD: 450 }),
  });
  logResult(18, 'Payment Timeout via X-Mock-Force', timePayRes.status === 202, `HTTP 202 pending state`);

  // 19. Duplicate Callback
  const eventId = `evt_dup_${Date.now()}`;
  const cb1Res = await fetch(`${BASE_URL}/api/payments/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId, payment_id: payData.paymentId, status: 'SUCCEEDED' }),
  });
  const cb1 = await safeJson(cb1Res, 'Test 19 CB1');
  const cb2Res = await fetch(`${BASE_URL}/api/payments/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId, payment_id: payData.paymentId, status: 'SUCCEEDED' }),
  });
  const cb2 = await safeJson(cb2Res, 'Test 19 CB2');
  logResult(19, 'Duplicate Callback Idempotency', cb2Res.status === 200 && cb2.duplicate === true, `duplicate flag: ${cb2.duplicate}`);

  // 20. Concurrent Duplicate Callback
  const concEventId = `evt_conc_dup_${Date.now()}`;
  const concCbReqs = Array.from({ length: 5 }, () =>
    fetch(`${BASE_URL}/api/payments/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: concEventId, payment_id: payData.paymentId, status: 'SUCCEEDED' }),
    })
  );
  const concCbResList = await Promise.all(concCbReqs);
  const concCbJsonList = await Promise.all(concCbResList.map((r, idx) => safeJson(r, `Test 20 ConcCB ${idx}`)));
  const processedCount = concCbJsonList.filter((j) => j.processed === true).length;
  const duplicateCount = concCbJsonList.filter((j) => j.duplicate === true).length;
  logResult(20, 'Concurrent Duplicate Callback', processedCount === 1 && duplicateCount === 4, `1 processed, 4 duplicates`);

  // 21. Callback Race (X-Mock-Force: race)
  const seats21 = await getFreshSeats();
  const raceHoldRes = await fetch(`${BASE_URL}/api/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'race-force-client' },
    body: JSON.stringify({ showId, seatIds: [seats21[0]] }),
  });
  const raceHold = await safeJson(raceHoldRes, 'Test 21 Hold');
  const racePayRes = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Mock-Force': 'race' },
    body: JSON.stringify({ holdId: raceHold.holdId, amountUSD: 450, name: 'Race Force User' }),
  });
  const racePayData = await safeJson(racePayRes, 'Test 21 Payment');
  logResult(21, 'Callback Race via X-Mock-Force', racePayData.status === 'confirmed', `status: ${racePayData.status}`);

  // 22. Booking Polling
  const pollBookingRes = await fetch(`${BASE_URL}/api/bookings/${raceHold.holdId}`);
  const pollBookingData = await safeJson(pollBookingRes, 'Test 22 Poll');
  logResult(22, 'Booking Polling Endpoint', pollBookingRes.status === 200 && pollBookingData.status === 'confirmed', `polled status: ${pollBookingData.status}`);

  // 23. Ticket PDF
  const ticketRes = await fetch(`${BASE_URL}/api/bookings/${raceHold.holdId}/ticket`);
  const ticketType = ticketRes.headers.get('content-type');
  const ticketBuf = await ticketRes.arrayBuffer();
  logResult(23, 'Ticket PDF Generation', ticketRes.status === 200 && ticketType.includes('pdf') && ticketBuf.byteLength > 500, `PDF size: ${ticketBuf.byteLength} bytes`);

  console.log('\n============================================================');
  console.log('      🎉 ALL 23 TEST SCENARIOS PASSED SUCCESSFULLY!');
  console.log('============================================================\n');
}

runLocalTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  process.exit(1);
});
