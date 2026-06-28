(() => {
  'use strict';

  const APP_ID = 'jinair-fare-bookmarklet-app';
  const API_URL = '/booking/getAirAvailabilityJson';

  if (document.getElementById(APP_ID)) {
    document.getElementById(APP_ID).remove();
    return;
  }

  const css = `
    #${APP_ID} {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 2147483647;
      width: min(440px, calc(100vw - 24px));
      max-height: calc(100vh - 36px);
      overflow: auto;
      background: #fff;
      color: #111827;
      border: 1px solid #d1d5db;
      border-radius: 16px;
      box-shadow: 0 18px 55px rgba(0,0,0,.24);
      font-family: Arial, "Noto Sans KR", sans-serif;
    }
    #${APP_ID} * { box-sizing: border-box; }
    #${APP_ID} .ja-head {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 16px; border-bottom:1px solid #e5e7eb;
      position:sticky; top:0; background:#fff; z-index:2;
    }
    #${APP_ID} .ja-title { font-size:17px; font-weight:800; }
    #${APP_ID} .ja-close {
      border:0; background:#f3f4f6; width:32px; height:32px;
      border-radius:8px; font-size:20px; cursor:pointer;
    }
    #${APP_ID} .ja-body { padding:14px 16px 18px; }
    #${APP_ID} .ja-grid {
      display:grid; grid-template-columns:1fr 1fr; gap:10px;
    }
    #${APP_ID} .ja-field { display:flex; flex-direction:column; gap:5px; }
    #${APP_ID} label { font-size:12px; font-weight:700; color:#4b5563; }
    #${APP_ID} input, #${APP_ID} select {
      width:100%; border:1px solid #d1d5db; border-radius:9px;
      padding:10px 11px; font-size:14px; background:#fff;
    }
    #${APP_ID} .ja-full { grid-column:1 / -1; }
    #${APP_ID} .ja-actions { display:flex; gap:8px; margin-top:12px; }
    #${APP_ID} button.ja-btn {
      flex:1; border:0; border-radius:10px; padding:11px 12px;
      font-size:14px; font-weight:800; cursor:pointer;
    }
    #${APP_ID} .ja-primary { background:#2563eb; color:#fff; }
    #${APP_ID} .ja-secondary { background:#eef2ff; color:#3730a3; }
    #${APP_ID} .ja-status {
      margin-top:12px; padding:10px 11px; border-radius:9px;
      background:#f9fafb; font-size:13px; white-space:pre-wrap;
    }
    #${APP_ID} .ja-error { background:#fef2f2; color:#991b1b; }
    #${APP_ID} .ja-result { margin-top:12px; display:flex; flex-direction:column; gap:12px; }
    #${APP_ID} .ja-flight {
      border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;
    }
    #${APP_ID} .ja-flight-head { padding:11px 12px; background:#f9fafb; }
    #${APP_ID} .ja-flight-no { font-weight:900; font-size:16px; }
    #${APP_ID} .ja-route { margin-top:3px; font-size:13px; color:#374151; }
    #${APP_ID} .ja-meta { margin-top:4px; font-size:12px; color:#6b7280; }
    #${APP_ID} .ja-fare { padding:10px 12px; border-top:1px solid #e5e7eb; }
    #${APP_ID} .ja-fare-top { display:flex; justify-content:space-between; gap:12px; }
    #${APP_ID} .ja-fare-name { font-weight:800; }
    #${APP_ID} .ja-price { font-weight:900; white-space:nowrap; }
    #${APP_ID} .ja-fare-sub { margin-top:4px; font-size:12px; color:#6b7280; }
    #${APP_ID} .ja-badge {
      display:inline-block; padding:2px 7px; border-radius:999px;
      font-size:11px; font-weight:800; background:#ecfdf5; color:#047857;
    }
    #${APP_ID} .ja-badge.off { background:#f3f4f6; color:#6b7280; }
    @media (max-width: 520px) {
      #${APP_ID} { top:8px; right:8px; width:calc(100vw - 16px); max-height:calc(100vh - 16px); }
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const today = new Date();
  const toInputDate = d => {
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
  };
  const plusDays = (d, days) => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  };

  const root = document.createElement('div');
  root.id = APP_ID;
  root.innerHTML = `
    <div class="ja-head">
      <div class="ja-title">진에어 운임 조회</div>
      <button class="ja-close" title="닫기">×</button>
    </div>
    <div class="ja-body">
      <div class="ja-grid">
        <div class="ja-field ja-full">
          <label>여정</label>
          <select id="ja-tripType">
            <option value="RT">왕복</option>
            <option value="OW">편도</option>
          </select>
        </div>
        <div class="ja-field">
          <label>출발지</label>
          <input id="ja-origin" maxlength="3" value="ICN" placeholder="ICN">
        </div>
        <div class="ja-field">
          <label>도착지</label>
          <input id="ja-destination" maxlength="3" value="NRT" placeholder="NRT">
        </div>
        <div class="ja-field">
          <label>출발일</label>
          <input id="ja-departureDate" type="date" value="${toInputDate(plusDays(today, 7))}">
        </div>
        <div class="ja-field" id="ja-returnWrap">
          <label>귀국일</label>
          <input id="ja-returnDate" type="date" value="${toInputDate(plusDays(today, 10))}">
        </div>
        <div class="ja-field">
          <label>성인</label>
          <input id="ja-adult" type="number" min="1" max="9" value="1">
        </div>
        <div class="ja-field">
          <label>소아</label>
          <input id="ja-child" type="number" min="0" max="9" value="0">
        </div>
        <div class="ja-field">
          <label>유아</label>
          <input id="ja-infant" type="number" min="0" max="9" value="0">
        </div>
        <div class="ja-field">
          <label>구매 국가</label>
          <input id="ja-pop" value="KR" maxlength="2">
        </div>
      </div>
      <div class="ja-actions">
        <button class="ja-btn ja-primary" id="ja-search">조회</button>
        <button class="ja-btn ja-secondary" id="ja-copy">결과 복사</button>
      </div>
      <div class="ja-status" id="ja-status">진에어 홈페이지에서 실행한 뒤 조회하세요.</div>
      <div class="ja-result" id="ja-result"></div>
    </div>
  `;

  document.body.appendChild(root);

  const $ = sel => root.querySelector(sel);
  const statusEl = $('#ja-status');
  const resultEl = $('#ja-result');
  let latestText = '';

  const setStatus = (message, isError = false) => {
    statusEl.textContent = message;
    statusEl.classList.toggle('ja-error', !!isError);
  };

  const esc = value => String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");

  const money = (value, currency = 'KRW') => {
    const n = Number(value || 0);
    try {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'KRW' ? 0 : 2
      }).format(n);
    } catch {
      return `${n.toLocaleString()} ${currency}`;
    }
  };

  const apiDate = v => String(v || '').replaceAll('-', '');

  function findCsrfToken() {
    const selectors = [
      'meta[name="_csrf"]',
      'meta[name="csrf-token"]',
      'meta[name="csrf_token"]',
      'input[name="_csrf"]',
      'input[name="csrf-token"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const value = el.content || el.value;
        if (value) return value;
      }
    }

    const candidates = [
      window._csrf,
      window.csrfToken,
      window.CSRF_TOKEN
    ];
    for (const value of candidates) {
      if (typeof value === 'string' && value) return value;
    }

    const scripts = [...document.scripts].map(s => s.textContent || '').join('\n');
    const patterns = [
      /["']?_csrf["']?\s*[:=]\s*["']([^"']+)["']/i,
      /["']?csrfToken["']?\s*[:=]\s*["']([^"']+)["']/i,
      /["']?csrf-token["']?\s*[:=]\s*["']([^"']+)["']/i
    ];
    for (const re of patterns) {
      const m = scripts.match(re);
      if (m?.[1]) return m[1];
    }
    return '';
  }

  function parseResponse(data) {
    const flights = [];
    const ods = data?.result?.originDestinationInfo || [];

    ods.forEach((od, odIndex) => {
      (od.tripInfo || []).forEach(trip => {
        (trip.segmentInfo || []).forEach(segment => {
          const fares = (segment.segmentAvailability || []).map(f => {
            const base = Number(f.adultAppliedFareAmount ?? f.adultDisplayFareAmount ?? f.appliedFareAmount ?? f.displayFareAmount ?? 0);
            const tax = Number(f.adultTaxAmount ?? f.taxAmount ?? 0);
            const surcharge = Number(f.adultSurchargeAmount ?? f.surchargeAmount ?? 0);
            const discount = Number(f.adultDiscountAmount ?? f.discountAmount ?? 0);
            return {
              fareName: f.fareTypeNm || f.fareBasisNm || f.fareType || f.fareBasis || '-',
              bookingClass: f.bookingClass || '-',
              inventoryStatus: f.inventoryStatus || '',
              seatText: f.seatAvailablityText || '',
              seatCount: f.seatAvailablity ?? null,
              available: f.inventoryStatus === 'AV',
              base,
              tax,
              surcharge,
              discount,
              total: base + tax + surcharge - discount,
              currency: f.adultAppliedFareCurrencyCode || f.adultDisplayFareCurrencyCode || f.displayFareCurrencyCode || 'KRW'
            };
          });

          flights.push({
            direction: odIndex + 1,
            flightNumber: segment.flightNm || `${segment.flightIdentifierInfo?.carrierCode || ''}${segment.flightIdentifierInfo?.flightNumber || ''}`,
            departureAirport: segment.departureAirportCode || segment.departureInfo?.airportCode || '',
            departureDateTime: segment.departureDateTime || '',
            departureTime: segment.departureTime || '',
            arrivalAirport: segment.arrivalAirportCode || segment.arrivalInfo?.airportCode || '',
            arrivalDateTime: segment.arrivalDateTime || '',
            arrivalTime: segment.arrivalTime || '',
            aircraft: segment.aircraft || segment.aircraftInfo?.type || '',
            journeyTime: segment.journeyTimeText || segment.journeyTime || '',
            fares
          });
        });
      });
    });

    return flights;
  }

  function renderFlights(flights) {
    if (!flights.length) {
      resultEl.innerHTML = '';
      latestText = '';
      setStatus('조회 결과에서 항공편을 찾지 못했습니다.', true);
      return;
    }

    const lines = [];
    resultEl.innerHTML = flights.map(f => {
      lines.push(
        `[${f.direction === 1 ? '가는편' : '오는편'}] ${f.flightNumber} ${f.departureAirport} ${f.departureTime} → ${f.arrivalAirport} ${f.arrivalTime}`,
        `${f.aircraft} · ${f.journeyTime}`
      );

      const faresHtml = f.fares.map(x => {
        const seat = x.seatText || (x.available ? (x.seatCount != null ? `잔여 ${x.seatCount}석` : '예약 가능') : '예약 마감');
        lines.push(`${x.fareName} / ${x.bookingClass} / ${seat} / ${money(x.total, x.currency)}`);

        return `
          <div class="ja-fare">
            <div class="ja-fare-top">
              <div>
                <div class="ja-fare-name">${esc(x.fareName)} <span class="ja-badge ${x.available ? '' : 'off'}">${esc(seat)}</span></div>
                <div class="ja-fare-sub">클래스 ${esc(x.bookingClass)} · 기본 ${esc(money(x.base, x.currency))} · 세금 ${esc(money(x.tax, x.currency))}</div>
              </div>
              <div class="ja-price">${esc(money(x.total, x.currency))}</div>
            </div>
          </div>
        `;
      }).join('');

      lines.push('');

      return `
        <div class="ja-flight">
          <div class="ja-flight-head">
            <div class="ja-flight-no">${f.direction === 1 ? '가는편' : '오는편'} · ${esc(f.flightNumber)}</div>
            <div class="ja-route">${esc(f.departureAirport)} ${esc(f.departureTime)} → ${esc(f.arrivalAirport)} ${esc(f.arrivalTime)}</div>
            <div class="ja-meta">${esc(f.aircraft)} · ${esc(f.journeyTime)}</div>
          </div>
          ${faresHtml || '<div class="ja-fare">표시 가능한 운임이 없습니다.</div>'}
        </div>
      `;
    }).join('');

    latestText = lines.join('\n');
    setStatus(`조회 완료 · 항공편 ${flights.length}개`);
  }

  async function search() {
    if (location.hostname !== 'www.jinair.com') {
      setStatus('www.jinair.com 페이지에서 실행해야 합니다.', true);
      return;
    }

    const tripType = $('#ja-tripType').value;
    const origin = $('#ja-origin').value.trim().toUpperCase();
    const destination = $('#ja-destination').value.trim().toUpperCase();
    const depDate = $('#ja-departureDate').value;
    const retDate = $('#ja-returnDate').value;
    const adult = $('#ja-adult').value;
    const child = $('#ja-child').value;
    const infant = $('#ja-infant').value;
    const pop = $('#ja-pop').value.trim().toUpperCase() || 'KR';

    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
      setStatus('출발지와 도착지는 3자리 IATA 코드로 입력하세요.', true);
      return;
    }
    if (!depDate || (tripType === 'RT' && !retDate)) {
      setStatus('여행 날짜를 입력하세요.', true);
      return;
    }

    const csrf = findCsrfToken();
    if (!csrf) {
      setStatus('CSRF 토큰을 찾지 못했습니다. 진에어 항공편 검색 페이지를 한 번 연 뒤 다시 실행하세요.', true);
      return;
    }

    const payload = {
      searchType: '',
      origin1: origin,
      destination1: destination,
      travelDate1: apiDate(depDate),
      origin2: tripType === 'RT' ? destination : '',
      destination2: tripType === 'RT' ? origin : '',
      travelDate2: tripType === 'RT' ? apiDate(retDate) : '',
      origin3: '',
      destination3: '',
      travelDate3: '',
      origin4: '',
      destination4: '',
      travelDate4: '',
      adultPaxCount: String(adult || '1'),
      childPaxCount: String(child || '0'),
      infantPaxCount: String(infant || '0'),
      tripType,
      pointOfPurchase: pop,
      promoCode: '',
      cpnNo: '',
      refVal: 'JINAIR',
      refChannel: '',
      refLang: '',
      refPop: '',
      cached: true,
      chgBestFareDate: 'false'
    };

    setStatus('진에어 서버에 조회 중...');
    resultEl.innerHTML = '';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrf
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}\n${text.slice(0, 500)}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`JSON 응답이 아닙니다.\n${text.slice(0, 500)}`);
      }

      if (data?.errorCode || data?.errorMsg) {
        throw new Error(data.errorMsg || data.errorDetail || data.errorCode);
      }

      renderFlights(parseResponse(data));
    } catch (error) {
      setStatus(`조회 실패\n${error?.message || error}`, true);
    }
  }

  $('#ja-close').onclick = () => root.remove();
  $('#ja-tripType').onchange = e => {
    $('#ja-returnWrap').style.display = e.target.value === 'RT' ? '' : 'none';
  };
  $('#ja-origin').oninput = e => e.target.value = e.target.value.toUpperCase();
  $('#ja-destination').oninput = e => e.target.value = e.target.value.toUpperCase();
  $('#ja-pop').oninput = e => e.target.value = e.target.value.toUpperCase();
  $('#ja-search').onclick = search;
  $('#ja-copy').onclick = async () => {
    if (!latestText) {
      setStatus('먼저 조회하세요.', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(latestText);
      setStatus('조회 결과를 클립보드에 복사했습니다.');
    } catch {
      setStatus('브라우저가 자동 복사를 막았습니다.', true);
    }
  };
})();