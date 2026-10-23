"""Calibration metrics (CR-14 PARTIAL): pure math, no invented vehicle data."""

from __future__ import annotations

from collections.abc import Sequence


def mae_mape(predicted: Sequence[float], observed: Sequence[float]) -> dict[str, float]:
    """Mean Absolute Error and Mean Absolute Percentage Error.

    Args:
        predicted: model outputs (e.g. HDT-v1 fuel litres per trip).
        observed: field measurements from telemetry ingest.

    Returns:
        {"mae": <litres>, "mape_pct": <percent>, "n": <count>}.

    Raises:
        ValueError: empty input, length mismatch, non-finite values,
            or zero observed value (MAPE undefined).
    """
    pred = [float(v) for v in predicted]
    obs = [float(v) for v in observed]
    if not pred or not obs:
        raise ValueError("predicted and observed must be non-empty")
    if len(pred) != len(obs):
        raise ValueError(f"length mismatch: {len(pred)} predicted vs {len(obs)} observed")
    for v in pred + obs:
        if v != v or v in (float("inf"), float("-inf")):  # noqa: PLR0124 - NaN / Inf guard
            raise ValueError("non-finite value in calibration input")
    if any(v == 0.0 for v in obs):
        raise ValueError("observed value is zero; MAPE undefined")
    n = len(pred)
    mae = sum(abs(p - o) for p, o in zip(pred, obs, strict=False)) / n
    mape_pct = sum(abs(o - p) / abs(o) for p, o in zip(pred, obs, strict=False)) / n * 100.0
    return {"mae": mae, "mape_pct": mape_pct, "n": float(n)}
