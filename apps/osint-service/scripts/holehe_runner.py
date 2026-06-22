#!/usr/bin/env python3
"""
Run holehe for an email and print JSON to stdout.
Usage: python3 holehe_runner.py <email>

Output: JSON array of platform results:
  [{ "platform": str, "exists": bool, "emailRecovery": bool, "rateLimit": bool }, ...]
"""
import sys
import json
import importlib
import pkgutil

try:
    import trio
    import httpx
    import holehe.modules
except ImportError as exc:
    sys.stderr.write(f"holehe not installed: {exc}\n")
    sys.exit(1)

GLOBAL_TIMEOUT = 60   # seconds — total max before returning partial results
MODULE_TIMEOUT = 8    # seconds per platform
MAX_CONCURRENT = 20   # max simultaneous HTTP connections


def discover_modules():
    """Yield (func, platform_name) for every holehe module found."""
    for _, modname, ispkg in pkgutil.walk_packages(
        path=holehe.modules.__path__,
        prefix=holehe.modules.__name__ + ".",
        onerror=lambda _: None,
    ):
        if ispkg:
            continue
        try:
            mod = importlib.import_module(modname)
            func_name = modname.split(".")[-1]
            func = getattr(mod, func_name, None)
            if callable(func):
                yield func, func_name
        except ImportError:
            pass


async def run_module(email, func, name, client, results, lock, limiter):
    async with limiter:
        try:
            out = []
            with trio.fail_after(MODULE_TIMEOUT):
                await func(email, client, out)
            async with lock:
                for entry in out:
                    results.append({
                        "platform": entry.get("name", name),
                        "exists": bool(entry.get("exists", False)),
                        # holehe returns a partial email string when used as recovery,
                        # or None/False when not. Convert to bool.
                        "emailRecovery": bool(entry.get("emailrecovery")),
                        "rateLimit": bool(entry.get("rateLimit", False)),
                    })
        except Exception:
            # Skip module silently — rate limit, timeout, parsing error, etc.
            pass


async def main(email):
    results = []
    lock = trio.Lock()
    limiter = trio.CapacityLimiter(MAX_CONCURRENT)

    async with httpx.AsyncClient() as client:
        try:
            with trio.fail_after(GLOBAL_TIMEOUT):
                async with trio.open_nursery() as nursery:
                    for func, name in discover_modules():
                        nursery.start_soon(
                            run_module, email, func, name, client, results, lock, limiter
                        )
        except trio.TooSlowError:
            # Return whatever finished within the global timeout
            pass

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps([]))
        sys.exit(0)

    results = trio.run(main, sys.argv[1])
    print(json.dumps(results))
