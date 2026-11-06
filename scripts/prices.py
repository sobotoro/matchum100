"""네이버 증권 시세를 가져와 market.json을 만듭니다. (GitHub Actions가 실행)

market.json 모양: {"asOf": ISO 시각, "label": "11월 6일 14:20 기준", "prices": {"005930": [현재가, 전일종가], ...}}
가져오지 못한 종목은 이전 값을 그대로 둡니다.
"""
import json, re, sys, urllib.request
from datetime import datetime, timezone, timedelta

CODES = ["005930", "000660", "402340", "009150", "373220", "207940", "005380", "105560", "032830", "028260",
         "196170", "086520", "247540", "036930", "277810", "028300", "039030", "222800", "240810", "058470"]
KST = timezone(timedelta(hours=9))
UA = {"User-Agent": "Mozilla/5.0 (classroom quiz price updater)"}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def num(v):
    s = re.sub(r"[^0-9.\-]", "", str(v if v is not None else ""))
    return float(s) if s not in ("", "-", ".") else None


def direction(d):
    txt = json.dumps(d, ensure_ascii=False) if d is not None else ""
    if re.search(r"FALL|LOWER|하락|하한", txt):
        return -1
    if re.search(r"RIS|UPPER|상승|상한", txt):
        return 1
    return 0


def parse(j):
    """네이버 응답 하나에서 (현재가, 전일종가, 거래시각)을 뽑습니다."""
    price = num(j.get("closePrice") or j.get("nv"))
    if not price:
        return None
    prev = num(j.get("pcv"))
    if not prev:
        diff = num(j.get("compareToPreviousClosePrice") if j.get("compareToPreviousClosePrice") is not None else j.get("cv"))
        if diff is not None:
            raw = str(j.get("compareToPreviousClosePrice", ""))
            sign = -1 if raw.strip().startswith("-") else direction(j.get("compareToPreviousPrice"))
            if sign == 0 and diff != 0:
                ratio = num(j.get("fluctuationsRatio"))
                sign = -1 if (ratio is not None and ratio < 0) else 1
            prev = price - sign * abs(diff)
    if not prev:
        ratio = num(j.get("fluctuationsRatio"))
        prev = round(price / (1 + ratio / 100)) if ratio is not None else price
    return int(round(price)), int(round(prev)), j.get("localTradedAt")


def fetch(code):
    try:
        r = parse(get(f"https://m.stock.naver.com/api/stock/{code}/basic"))
        if r:
            return r
    except Exception as e:
        print(code, "m.stock 실패:", e, file=sys.stderr)
    try:
        j = get(f"https://polling.finance.naver.com/api/realtime/domestic/stock/{code}")
        r = parse((j.get("datas") or [{}])[0])
        if r:
            return r
    except Exception as e:
        print(code, "polling 실패:", e, file=sys.stderr)
    return None


def main(old_path, out_path):
    try:
        old = json.load(open(old_path, encoding="utf-8"))
    except Exception:
        old = {"prices": {}}
    prices = dict(old.get("prices") or {})
    ok, last_trade = 0, None
    for c in CODES:
        r = fetch(c)
        if r:
            prices[c] = [r[0], r[1]]
            ok += 1
            last_trade = last_trade or r[2]
    now = datetime.now(KST)
    t = now
    if last_trade:
        try:
            t = datetime.fromisoformat(str(last_trade)).astimezone(KST)
        except Exception:
            pass
    closed = t.hour * 60 + t.minute >= 15 * 60 + 30 or now.date() > t.date()
    label = f"{t.month}월 {t.day}일 종가" if closed else f"{t.month}월 {t.day}일 {t:%H:%M} 기준"
    out = {"asOf": now.isoformat(timespec="seconds"), "label": label if ok else old.get("label", ""), "ok": ok, "prices": prices}
    json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{ok}/{len(CODES)}개 종목 갱신 · {out['label']}")
    if ok == 0:
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
