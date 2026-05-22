"""Centralized LLM client — OpenRouter primary, Anthropic fallback."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from app.config import get_settings

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "anthropic/claude-sonnet-4-6"
DEFAULT_MAX_TOKENS = 512
DEFAULT_TIMEOUT = 30.0


@dataclass
class LLMResponse:
    text: str | None
    input_tokens: int
    model: str
    provider: str  # "openrouter" or "anthropic"


def _try_openrouter(
    *,
    system: str,
    content: str,
    model: str,
    max_tokens: int,
    timeout: float,
    api_key: str,
) -> LLMResponse | None:
    try:
        from openai import OpenAI

        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            timeout=timeout,
        )
        response = client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": content},
            ],
        )
        choice = response.choices[0] if response.choices else None
        text = choice.message.content if choice and choice.message else None
        input_tokens = response.usage.prompt_tokens if response.usage else 0
        return LLMResponse(
            text=text,
            input_tokens=input_tokens,
            model=model,
            provider="openrouter",
        )
    except Exception as exc:
        logger.warning("OpenRouter call failed, will try Anthropic fallback: %s", exc)
        return None


def _try_anthropic(
    *,
    system: str,
    content: str,
    model: str,
    max_tokens: int,
    timeout: float,
    api_key: str,
) -> LLMResponse | None:
    try:
        import anthropic

        anthropic_model = model.removeprefix("anthropic/")
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=anthropic_model,
            max_tokens=max_tokens,
            timeout=timeout,
            system=system,
            messages=[{"role": "user", "content": content}],
        )
        text = response.content[0].text if response.content else None
        input_tokens = getattr(response.usage, "input_tokens", 0)
        return LLMResponse(
            text=text,
            input_tokens=input_tokens,
            model=anthropic_model,
            provider="anthropic",
        )
    except Exception as exc:
        logger.warning("Anthropic call failed: %s", exc)
        return None


def call_llm(
    *,
    system: str,
    content: str,
    model: str = DEFAULT_MODEL,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    timeout: float = DEFAULT_TIMEOUT,
) -> LLMResponse:
    """Call LLM with OpenRouter primary, Anthropic fallback.

    Returns LLMResponse with text=None if both providers fail.
    """
    settings = get_settings()

    if settings.openrouter_api_key:
        result = _try_openrouter(
            system=system,
            content=content,
            model=model,
            max_tokens=max_tokens,
            timeout=timeout,
            api_key=settings.openrouter_api_key,
        )
        if result is not None:
            return result

    if settings.anthropic_api_key:
        result = _try_anthropic(
            system=system,
            content=content,
            model=model,
            max_tokens=max_tokens,
            timeout=timeout,
            api_key=settings.anthropic_api_key,
        )
        if result is not None:
            return result

    logger.warning("No LLM provider available (both OpenRouter and Anthropic unconfigured or failed)")
    return LLMResponse(text=None, input_tokens=0, model=model, provider="none")
