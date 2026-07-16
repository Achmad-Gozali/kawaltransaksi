#!/usr/bin/env python3
"""
Script audit: memastikan semua laporan berstatus 'verified' di database
benar-benar bisa ditemukan lewat endpoint publik /api/reports/public/check/{nomor}.

Dijalankan DI VPS (bukan di laptop lokal), karena target-nya http://localhost:4000
yang hanya bisa diakses dari dalam VPS itu sendiri.

Cara pakai:
    cd ~/kawaltransaksi
    python3 audit_check.py
"""

import json
import subprocess
import time

NUMBERS = [
    "8099081223937042", "085624096975", "3410898062", "0131547862100", "901086164794",
    "089682461016", "406101008274502", "085881678712", "083879915518", "6457020891",
    "085238740722", "7355656122", "1770026813003", "901373027170", "094601023846502",
    "1952950565", "085751842683", "87813132002", "707890653900", "1886236882",
    "901056561464", "085651245057", "085753540615", "085882203024", "087865331229",
    "1500035874708", "8881277555", "085119534573", "1300028897653", "085220746529",
    "083197025501", "6630560274", "50631409816", "085245753901", "009201138985507",
    "901408146864", "088987308874", "1720006825048", "08987886130", "089672482453",
    "089508401423", "8288912663", "026601025199537", "083176994879", "513901027431539",
    "901618467609", "1130018115828", "081585195791", "085709039049", "2010753158",
    "901027586205", "85822591889", "089502292947", "901606882070", "011601184689507",
]

BASE_URL = "http://localhost:4000/api/reports/public/check/"
DELAY_SECONDS = 1.3  # jeda antar-request, biar tidak kena rate limit (50 req/menit)


def check_number(number: str) -> dict:
    """Panggil endpoint publik untuk satu nomor, kembalikan hasil terstruktur."""
    try:
        raw = subprocess.run(
            ["curl", "-s", f"{BASE_URL}{number}"],
            capture_output=True, text=True, timeout=10,
        ).stdout
        body = json.loads(raw)
    except (json.JSONDecodeError, subprocess.TimeoutExpired) as e:
        return {"number": number, "ok": False, "reason": f"gagal parse response ({e})", "raw": raw[:200] if 'raw' in dir() else ""}

    if "statusCode" in body and body.get("statusCode") == 429:
        return {"number": number, "ok": False, "reason": "kena rate limit (429)", "raw": body}

    reports = body.get("data", {}).get("reports", [])
    if len(reports) == 0:
        return {"number": number, "ok": False, "reason": "reports kosong (0 hasil)", "raw": body}

    statuses = [r.get("status") for r in reports]
    if "verified" not in statuses:
        return {"number": number, "ok": False, "reason": f"ditemukan tapi tidak ada status verified (status: {statuses})", "raw": body}

    return {"number": number, "ok": True, "reason": "OK", "raw": None}


def main():
    total = len(NUMBERS)
    results = []

    print(f"Mengaudit {total} nomor verified, jeda {DELAY_SECONDS}s per request...\n")

    for i, number in enumerate(NUMBERS, start=1):
        result = check_number(number)
        results.append(result)
        status_label = "OK" if result["ok"] else "GAGAL"
        print(f"[{i}/{total}] {status_label:5s} {number:20s} {result['reason']}")
        if i < total:
            time.sleep(DELAY_SECONDS)

    ok_count = sum(1 for r in results if r["ok"])
    fail_count = total - ok_count

    print("\n" + "=" * 50)
    print(f"HASIL AUDIT: {ok_count}/{total} berhasil, {fail_count} gagal")
    print("=" * 50)

    if fail_count > 0:
        print("\nDetail yang GAGAL:")
        for r in results:
            if not r["ok"]:
                print(f"\n  Nomor  : {r['number']}")
                print(f"  Alasan : {r['reason']}")
                if r["raw"]:
                    print(f"  Respon : {json.dumps(r['raw'], ensure_ascii=False)[:300]}")


if __name__ == "__main__":
    main()