(() => {
  'use strict';

  const APP_ID = 'jinair-fare-bookmarklet-app';
  const API_URL = '/booking/getAirAvailabilityJson';
  const REQUEST_DELAY_MS = 900;

  if (document.getElementById(APP_ID)) {
    document.getElementById(APP_ID).remove();
    return;
  }

  const css = `
    #${APP_ID}{
      position:fixed;top:12px;right:12px;z-index:2147483647;
      width:min(720px,calc(100vw - 24px));max-height:calc(100vh - 24px);
      overflow:auto;background:#fff;color:#111827;border:1px solid #d1d5db;
      border-radius:16px;box-shadow:0 18px 55px rgba(0,0,0,.24);
      font-family:Arial,"Noto Sans KR",sans-serif
    }
    #${APP_ID} *{box-sizing:border-box}
    #${APP_ID} .ja-head{
      display:flex;align-items:center;justify-content:space-between;
      padding:14px 16px;border-bottom:1px solid #e5e7eb;
      position:sticky;top:0;background:#fff;z-index:3
    }
    #${APP_ID} .ja-title{font-size:17px;font-weight:800}
    #${APP_ID} .ja-close{
      border:0;background:#f3f4f6;width:32px;height:32px;
      border-radius:8px;font-size:20px;cursor:pointer
    }
    #${APP_ID} .ja-body{padding:14px 16px 18px}
    #${APP_ID} .ja-grid{
      display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px
    }
    #${APP_ID} .ja-field{display:flex;flex-direction:column;gap:5px}
    #${APP_ID} .ja-span2{grid-column:span 2}
    #${APP_ID} label{font-size:12px;font-weight:700;color:#4b5563}
    #${APP_ID} input,#${APP_ID} select{
      width:100%;border:1px solid #d1d5db;border-radius:9px;
      padding:9px 10px;font-size:13px;background:#fff
    }
    #${APP_ID} .ja-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
    #${APP_ID} button.ja-btn{
      border:0;border-radius:10px;padding:10px 14px;
      font-size:13px;font-weight:800;cursor:pointer
    }
    #${APP_ID} .ja-primary{background:#2563eb;color:#fff}
    #${APP_ID} .ja-secondary{background:#eef2ff;color:#3730a3}
    #${APP_ID} .ja-danger{background:#fef2f2;color:#991b1b}
    #${APP_ID} button:disabled{opacity:.55;cursor:not-allowed}
    #${APP_ID} .ja-status{
      margin-top:12px;padding:10px 11px;border-radius:9px;
      background:#f9fafb;font-size:13px;white-space:pre-wrap
    }
    #${APP_ID} .ja-error{background:#fef2f2;color:#991b1b}
    #${APP_ID} .ja-summary{
      margin-top:12px;font-size:12px;color:#4b5563
    }
    #${APP_ID} .ja-table-wrap{
      margin-top:10px;border:1px solid #e5e7eb;border-radius:10px;
      overflow:auto;max-height:55vh
    }
    #${APP_ID} table{
      width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap
    }
    #${APP_ID} th,#${APP_ID} td{
      padding:8px 9px;border-bottom:1px solid #e5e7eb;text-align:left
    }
    #${APP_ID} th{
      position:sticky;top:0;background:#f9fafb;z-index:2;font-weight:800
    }
    #${APP_ID} tr:hover td{background:#f8fafc}
    #${APP_ID} .ja-price{font-weight:800;text-align:right}
    #${APP_ID} .ja-ok{color:#047857;font-weight:800}
    #${APP_ID} .ja-off{color:#6b7280}
    @media(max-width:720px){
      #${APP_ID}{top:6px;right:6px;width:calc(100vw - 12px);max-height:calc(100vh - 12px)}
      #${APP_ID} .ja-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      #${APP_ID} .ja-span2{grid-column:span 2}
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const pad = n => String(n).padStart(2, '0');
  const formatInputDate = d =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const addDays = (dateValue, days) => {
    const d = new Date(`${dateValue}T00:00:00`);
    d.setDate(d.getDate() + Number(days || 0));
    return formatInputDate(d);
  };

  const dateRange = (start, end) => {
    const rows = [];
    let d = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    while (d <= last) {
      rows.push(formatInputDate(d));
      d.setDate(d.getDate() + 1);
    }
    return rows;
  };

  const today = new Date();
  const defaultStart = formatInputDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7));
  const defaultEnd = formatInputDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13));

  const root = document.createElement('div');
  root.id = APP_ID;
  root.innerHTML = `
    <div class="ja-head">
      <div class="ja-title">진에어 다중 날짜 운임 조회</div>
      <button class="ja-close" title="닫기">×</button>
    </div>
    <div class="ja-body">
      <div class="ja-grid">
        <div class="ja-field">
          <label>여정</label>
          <select id="ja-tripType">
            <option value="OW">편도</option>
            <option value="RT">왕복</option>
          </select>
        </div>
        <div class="ja-field">
          <label>출발지</label>
          <input id="ja-origin" maxlength="3" value="ICN">
        </div>
        <div class="ja-field">
          <label>도착지</label>
          <input id="ja-destination" maxlength="3" value="NRT">
        </div>
        <div class="ja-field" id="ja-stayWrap">
          <label>체류일수</label>
          <input id="ja-stayDays" type="number" min="1" max="30" value="3">
        </div>

        <div class="ja-field ja-span2">
          <label>조회 시작일</label>
          <input id="ja-startDate" type="date" value="${defaultStart}">
        </div>
        <div class="ja-field ja-span2">
          <label>조회 종료일</label>
          <input id="ja-endDate" type="date" value="${defaultEnd}">
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
          <input id="ja-pop" maxlength="2" value="KR">
        </div>
      </div>

      <div class="ja-actions">
        <button class="ja-btn ja-primary" id="ja-search">여러 날짜 조회</button>
        <button class="ja-btn ja-danger" id="ja-stop" disabled>중지</button>
        <button class="ja-btn ja-secondary" id="ja-download" disabled>CSV 다운로드</button>
        <button class="ja-btn ja-secondary" id="ja-copy" disabled>표 복사</button>
      </div>

      <div class="ja-status" id="ja-status">날짜 범위를 지정한 뒤 조회하세요.</div>
      <div class="ja-summary" id="ja-summary"></div>

      <div class="ja-table-wrap">
        <table>
          <thead>
            <tr>
              <th>출발일</th>
              <th>귀국일</th>
              <th>방향</th>
              <th>편명</th>
              <th>구간</th>
              <th>시간</th>
              <th>기종</th>
              <th>운임</th>
              <th>클래스</th>
              <th>잔여석</th>
              <th>기본운임</th>
              <th>세금</th>
              <th>총액</th>
            </tr>
          </thead>
          <tbody id="ja-tbody"></tbody>
        </table>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const $ = sel => root.querySelector(sel);
  const statusEl = $('#ja-status');
  const summaryEl = $('#ja-summary');
  const tbody = $('#ja-tbody');
  const searchBtn = $('#ja-search');
  const stopBtn = $('#ja-stop');
  const downloadBtn = $('#ja-download');
  const copyBtn = $('#ja-copy');

  let stopRequested = false;
  let resultRows = [];

  const setStatus = (msg, isError = false) => {
    statusEl.textContent = msg;
    statusEl.classList.toggle('ja-error', !!isError);
  };

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const apiDate = v => String(v || '').replaceAll('-', '');

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const numberFormat = value =>
    Number(value || 0).toLocaleString('ko-KR');

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
      const value = el?.content || el?.value;
      if (value) return value;
    }

    const globalCandidates = [
      window._csrf,
      window.csrfToken,
      window.CSRF_TOKEN
    ];

    for (const value of globalCandidates) {
      if (typeof value === 'string' && value) return value;
    }

    const scripts = [...document.scripts].map(s => s.textContent || '').join('\n');
    const patterns = [
      /["']?_csrf["']?\s*[:=]\s*["']([^"']+)["']/i,
      /["']?csrfToken["']?\s*[:=]\s*["']([^"']+)["']/i,
      /["']?csrf-token["']?\s*[:=]\s*["']([^"']+)["']/i
    ];

    for (const re of patterns) {
      const match = scripts.match(re);
      if (match?.[1]) return match[1];
    }

    return '';
  }

  function buildPayload(depDate, returnDate, values) {
    const isRoundTrip = values.tripType === 'RT';

    return {
      searchType: '',
      origin1: values.origin,
      destination1: values.destination,
      travelDate1: apiDate(depDate),

      origin2: isRoundTrip ? values.destination : '',
      destination2: isRoundTrip ? values.origin : '',
      travelDate2: isRoundTrip ? apiDate(returnDate) : '',

      origin3: '',
      destination3: '',
      travelDate3: '',
      origin4: '',
      destination4: '',
      travelDate4: '',

      adultPaxCount: values.adult,
      childPaxCount: values.child,
      infantPaxCount: values.infant,

      tripType: values.tripType,
      pointOfPurchase: values.pop,

      promoCode: '',
      cpnNo: '',
      refVal: 'JINAIR',
      refChannel: '',
      refLang: '',
      refPop: '',

      cached: true,
      chgBestFareDate: 'false'
    };
  }

  async function requestAvailability(payload, csrfToken) {
    const response = await fetch(API_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrfToken
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 250)}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`JSON 응답이 아닙니다: ${text.slice(0, 250)}`);
    }

    if (data?.errorCode || data?.errorMsg) {
      throw new Error(data.errorMsg || data.errorDetail || data.errorCode);
    }

    return data;
  }

  function parseRows(data, searchDepartureDate, searchReturnDate) {
    const rows = [];
    const ods = data?.result?.originDestinationInfo || [];

    ods.forEach((od, odIndex) => {
      (od.tripInfo || []).forEach(trip => {
        (trip.segmentInfo || []).forEach(segment => {
          const fares = segment.segmentAvailability || [];

          fares.forEach(fare => {
            const baseFare = Number(
              fare.adultAppliedFareAmount ??
              fare.adultDisplayFareAmount ??
              fare.appliedFareAmount ??
              fare.displayFareAmount ??
              0
            );

            const tax = Number(
              fare.adultTaxAmount ??
              fare.taxAmount ??
              0
            );

            const surcharge = Number(
              fare.adultSurchargeAmount ??
              fare.surchargeAmount ??
              0
            );

            const discount = Number(
              fare.adultDiscountAmount ??
              fare.discountAmount ??
              0
            );

            rows.push({
              searchDepartureDate,
              searchReturnDate: searchReturnDate || '',
              direction: odIndex === 0 ? '가는편' : '오는편',
              flightNumber:
                segment.flightNm ||
                `${segment.flightIdentifierInfo?.carrierCode || ''}${segment.flightIdentifierInfo?.flightNumber || ''}`,
              route:
                `${segment.departureAirportCode || segment.departureInfo?.airportCode || ''}-` +
                `${segment.arrivalAirportCode || segment.arrivalInfo?.airportCode || ''}`,
              time:
                `${segment.departureTime || ''}-${segment.arrivalTime || ''}`,
              aircraft:
                segment.aircraft ||
                segment.aircraftInfo?.type ||
                '',
              fareName:
                fare.fareTypeNm ||
                fare.fareBasisNm ||
                fare.fareType ||
                fare.fareBasis ||
                '-',
              bookingClass: fare.bookingClass || '-',
              seatText:
                fare.seatAvailablityText ||
                (fare.inventoryStatus === 'AV'
                  ? (fare.seatAvailablity != null
                    ? `잔여 ${fare.seatAvailablity}석`
                    : '예약 가능')
                  : '예약 마감'),
              available: fare.inventoryStatus === 'AV',
              baseFare,
              tax,
              totalFare: baseFare + tax + surcharge - discount,
              currency:
                fare.adultAppliedFareCurrencyCode ||
                fare.adultDisplayFareCurrencyCode ||
                fare.displayFareCurrencyCode ||
                'KRW'
            });
          });
        });
      });
    });

    return rows;
  }

  function renderRows() {
    tbody.innerHTML = resultRows.map(row => `
      <tr>
        <td>${esc(row.searchDepartureDate)}</td>
        <td>${esc(row.searchReturnDate)}</td>
        <td>${esc(row.direction)}</td>
        <td>${esc(row.flightNumber)}</td>
        <td>${esc(row.route)}</td>
        <td>${esc(row.time)}</td>
        <td>${esc(row.aircraft)}</td>
        <td>${esc(row.fareName)}</td>
        <td>${esc(row.bookingClass)}</td>
        <td class="${row.available ? 'ja-ok' : 'ja-off'}">${esc(row.seatText)}</td>
        <td class="ja-price">${esc(numberFormat(row.baseFare))}</td>
        <td class="ja-price">${esc(numberFormat(row.tax))}</td>
        <td class="ja-price">${esc(numberFormat(row.totalFare))}</td>
      </tr>
    `).join('');

    const availableRows = resultRows.filter(r => r.available);
    const minFare = availableRows.length
      ? Math.min(...availableRows.map(r => r.totalFare))
      : null;

    summaryEl.textContent =
      `총 ${resultRows.length.toLocaleString()}개 운임 행 · ` +
      `예약 가능 ${availableRows.length.toLocaleString()}개` +
      (minFare != null ? ` · 최저 총액 ${numberFormat(minFare)}원` : '');

    downloadBtn.disabled = resultRows.length === 0;
    copyBtn.disabled = resultRows.length === 0;
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return `"${text.replaceAll('"', '""')}"`;
  }

  function makeCsv() {
    const headers = [
      '출발일','귀국일','방향','편명','구간','시간','기종',
      '운임','클래스','잔여석','기본운임','세금','총액','통화'
    ];

    const lines = [headers.map(csvEscape).join(',')];

    resultRows.forEach(row => {
      lines.push([
        row.searchDepartureDate,
        row.searchReturnDate,
        row.direction,
        row.flightNumber,
        row.route,
        row.time,
        row.aircraft,
        row.fareName,
        row.bookingClass,
        row.seatText,
        row.baseFare,
        row.tax,
        row.totalFare,
        row.currency
      ].map(csvEscape).join(','));
    });

    return '\uFEFF' + lines.join('\r\n');
  }

  function downloadCsv() {
    if (!resultRows.length) return;

    const origin = $('#ja-origin').value.trim().toUpperCase();
    const destination = $('#ja-destination').value.trim().toUpperCase();
    const startDate = $('#ja-startDate').value.replaceAll('-', '');
    const endDate = $('#ja-endDate').value.replaceAll('-', '');

    const blob = new Blob([makeCsv()], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JINAIR_${origin}-${destination}_${startDate}-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copyTable() {
    if (!resultRows.length) return;

    const headers = [
      '출발일','귀국일','방향','편명','구간','시간','기종',
      '운임','클래스','잔여석','기본운임','세금','총액'
    ];

    const lines = [headers.join('\t')];

    resultRows.forEach(row => {
      lines.push([
        row.searchDepartureDate,
        row.searchReturnDate,
        row.direction,
        row.flightNumber,
        row.route,
        row.time,
        row.aircraft,
        row.fareName,
        row.bookingClass,
        row.seatText,
        row.baseFare,
        row.tax,
        row.totalFare
      ].join('\t'));
    });

    await navigator.clipboard.writeText(lines.join('\n'));
    setStatus('표 데이터를 클립보드에 복사했습니다.');
  }

  async function runSearch() {
    if (location.hostname !== 'www.jinair.com') {
      setStatus('www.jinair.com 페이지에서 실행해야 합니다.', true);
      return;
    }

    const values = {
      tripType: $('#ja-tripType').value,
      origin: $('#ja-origin').value.trim().toUpperCase(),
      destination: $('#ja-destination').value.trim().toUpperCase(),
      stayDays: Number($('#ja-stayDays').value || 0),
      startDate: $('#ja-startDate').value,
      endDate: $('#ja-endDate').value,
      adult: String($('#ja-adult').value || '1'),
      child: String($('#ja-child').value || '0'),
      infant: String($('#ja-infant').value || '0'),
      pop: $('#ja-pop').value.trim().toUpperCase() || 'KR'
    };

    if (!/^[A-Z]{3}$/.test(values.origin) ||
        !/^[A-Z]{3}$/.test(values.destination)) {
      setStatus('공항 코드는 3자리 IATA 코드로 입력하세요.', true);
      return;
    }

    if (!values.startDate || !values.endDate) {
      setStatus('조회 시작일과 종료일을 입력하세요.', true);
      return;
    }

    if (values.startDate > values.endDate) {
      setStatus('조회 종료일은 시작일 이후여야 합니다.', true);
      return;
    }

    const dates = dateRange(values.startDate, values.endDate);

    if (dates.length > 31) {
      setStatus('한 번에 최대 31일까지만 조회할 수 있습니다.', true);
      return;
    }

    if (values.tripType === 'RT' &&
        (!Number.isFinite(values.stayDays) || values.stayDays < 1)) {
      setStatus('왕복 조회 시 체류일수를 1일 이상 입력하세요.', true);
      return;
    }

    const csrfToken = findCsrfToken();

    if (!csrfToken) {
      setStatus(
        'CSRF 토큰을 찾지 못했습니다.\n' +
        '진에어에서 항공편 검색 결과 화면을 먼저 연 뒤 다시 실행하세요.',
        true
      );
      return;
    }

    stopRequested = false;
    resultRows = [];
    tbody.innerHTML = '';
    summaryEl.textContent = '';
    downloadBtn.disabled = true;
    copyBtn.disabled = true;
    searchBtn.disabled = true;
    stopBtn.disabled = false;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < dates.length; i++) {
      if (stopRequested) break;

      const depDate = dates[i];
      const returnDate =
        values.tripType === 'RT'
          ? addDays(depDate, values.stayDays)
          : '';

      setStatus(
        `조회 중 ${i + 1}/${dates.length}\n` +
        `${depDate}` +
        (returnDate ? ` → ${returnDate}` : '')
      );

      try {
        const payload = buildPayload(depDate, returnDate, values);
        const data = await requestAvailability(payload, csrfToken);
        const rows = parseRows(data, depDate, returnDate);

        resultRows.push(...rows);
        successCount++;
        renderRows();
      } catch (error) {
        failCount++;
        console.error('[Jinair Bookmarklet]', depDate, error);
      }

      if (i < dates.length - 1 && !stopRequested) {
        await sleep(REQUEST_DELAY_MS);
      }
    }

    searchBtn.disabled = false;
    stopBtn.disabled = true;

    if (stopRequested) {
      setStatus(
        `사용자가 조회를 중지했습니다.\n` +
        `성공 ${successCount}일 / 실패 ${failCount}일`
      );
    } else if (failCount > 0) {
      setStatus(
        `조회 완료\n성공 ${successCount}일 / 실패 ${failCount}일\n` +
        `일부 날짜는 세션 또는 서버 응답 문제로 실패했습니다.`,
        true
      );
    } else {
      setStatus(`조회 완료 · ${successCount}일 모두 성공`);
    }

    renderRows();
  }

  $('.ja-close').onclick = () => root.remove();

  $('#ja-tripType').onchange = event => {
    $('#ja-stayWrap').style.display =
      event.target.value === 'RT' ? '' : 'none';
  };

  $('#ja-tripType').dispatchEvent(new Event('change'));

  ['#ja-origin', '#ja-destination', '#ja-pop'].forEach(sel => {
    $(sel).oninput = event => {
      event.target.value = event.target.value.toUpperCase();
    };
  });

  searchBtn.onclick = runSearch;

  stopBtn.onclick = () => {
    stopRequested = true;
    stopBtn.disabled = true;
    setStatus('현재 요청이 끝난 뒤 중지합니다.');
  };

  downloadBtn.onclick = downloadCsv;

  copyBtn.onclick = async () => {
    try {
      await copyTable();
    } catch (error) {
      setStatus(`복사 실패: ${error.message || error}`, true);
    }
  };
})();
