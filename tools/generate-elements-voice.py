import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
VOICES = {
    "nian": ("zh-CN-YunxiaNeural", "+0%"),
    "dad": ("zh-CN-YunxiNeural", "-5%"),
}


async def generate():
    lines = subprocess.check_output(
        ["node", "--input-type=module", "-e",
         "import { elementsTalks } from './src/elements-talks.js'; console.log(JSON.stringify(elementsTalks))"],
        cwd=ROOT, encoding="utf-8",
    )
    target = ROOT / "public" / "voice" / "elements"
    target.mkdir(parents=True, exist_ok=True)
    slots = asyncio.Semaphore(3)

    async def record(name, role, text):
        destination = target / f"{name}-{role}.mp3"
        temporary = destination.with_suffix(".tmp")
        voice, rate = VOICES[role]
        async with slots:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, voice, rate=rate).save(temporary)
                    temporary.replace(destination)
                    print(destination.name, flush=True)
                    return
                except Exception:
                    temporary.unlink(missing_ok=True)
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2 ** attempt)

    await asyncio.gather(*(
        record(f"{lesson}-{i + 1}", role, turn[role])
        for lesson, turns in json.loads(lines).items()
        for i, turn in enumerate(turns)
        for role in VOICES
    ))


if __name__ == "__main__":
    asyncio.run(generate())
