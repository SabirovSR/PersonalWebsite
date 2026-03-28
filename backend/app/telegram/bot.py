"""
Telegram bot for receiving contact notifications and managing owner status/blog.
"""

import asyncio
import json
import logging
from typing import Any
from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

from app.config import get_settings
from app.models import ContactMessage
from app.services.status_service import BLOG_PUBSUB_CHANNEL, STATUSES, status_service

logger = logging.getLogger(__name__)

settings = get_settings()

# Initialize bot and dispatcher
bot = Bot(token=settings.telegram_bot_token) if settings.telegram_bot_token else None
dp = Dispatcher()

_polling_task: asyncio.Task[None] | None = None


# ---------------------------------------------------------------------------
# FSM States
# ---------------------------------------------------------------------------

class NewPostStates(StatesGroup):
    waiting_for_title = State()
    waiting_for_content = State()
    confirming = State()


class EditPostStates(StatesGroup):
    waiting_for_new_content = State()


# ---------------------------------------------------------------------------
# Auth middleware — owner only
# ---------------------------------------------------------------------------

@dp.message.middleware()
async def auth_middleware(handler, event: Message, data: dict) -> Any:
    """Only allow messages from the owner."""
    if event.from_user is None:
        return None
    if event.from_user.id != settings.telegram_owner_id:
        logger.warning(f"Unauthorized access attempt from user {event.from_user.id}")
        return None
    return await handler(event, data)


@dp.callback_query.middleware()
async def auth_callback_middleware(handler, event: CallbackQuery, data: dict) -> Any:
    """Only allow callbacks from the owner."""
    if event.from_user is None:
        return None
    if event.from_user.id != settings.telegram_owner_id:
        logger.warning(f"Unauthorized callback from user {event.from_user.id}")
        await event.answer("⛔ Доступ запрещён", show_alert=True)
        return None
    return await handler(event, data)


# ---------------------------------------------------------------------------
# Keyboards
# ---------------------------------------------------------------------------

def get_main_menu() -> InlineKeyboardMarkup:
    """Main navigation menu."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📊 Статус",  callback_data="menu:status"),
            InlineKeyboardButton(text="📝 Блог",    callback_data="menu:blog"),
        ],
        [InlineKeyboardButton(text="ℹ️ Инфо",       callback_data="menu:info")],
    ])


def get_status_keyboard() -> InlineKeyboardMarkup:
    """Status selection keyboard with back-to-menu button."""
    buttons = [
        [InlineKeyboardButton(
            text=f"{info['emoji']} {info['label_ru']}",
            callback_data=f"status:{code}",
        )]
        for code, info in STATUSES.items()
    ]
    buttons.append([InlineKeyboardButton(text="« Главное меню", callback_data="menu:back")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_status_set_keyboard() -> InlineKeyboardMarkup:
    """Keyboard shown after status is set."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="« Статусы",    callback_data="menu:status"),
            InlineKeyboardButton(text="« Меню",       callback_data="menu:back"),
        ],
    ])


def get_blog_menu() -> InlineKeyboardMarkup:
    """Blog section menu."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✍️ Новая заметка", callback_data="blog:new"),
            InlineKeyboardButton(text="📚 Мои заметки",   callback_data="blog:list"),
        ],
        [InlineKeyboardButton(text="« Главное меню", callback_data="menu:back")],
    ])


def get_confirm_post_keyboard(title: str) -> InlineKeyboardMarkup:
    """Keyboard to confirm blog post publication."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Опубликовать", callback_data="post:publish"),
            InlineKeyboardButton(text="📝 Черновик",    callback_data="post:draft"),
        ],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="post:cancel")],
    ])


def get_post_actions_keyboard(post_id: str, published: bool) -> InlineKeyboardMarkup:
    """Keyboard for managing an existing post."""
    toggle_label = "🙈 Скрыть" if published else "👁 Опубликовать"
    toggle_data  = f"post_toggle:{post_id}"
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text=toggle_label, callback_data=toggle_data),
            InlineKeyboardButton(text="🗑 Удалить", callback_data=f"post_delete:{post_id}"),
        ],
        [InlineKeyboardButton(text="✏️ Изменить", callback_data=f"post_edit:{post_id}")],
        [
            InlineKeyboardButton(text="« Блог",    callback_data="blog:list"),
            InlineKeyboardButton(text="« Меню",    callback_data="menu:back"),
        ],
    ])


# ---------------------------------------------------------------------------
# Basic commands
# ---------------------------------------------------------------------------

@dp.message(Command("start"))
async def cmd_start(message: Message):
    """Handle /start command — show main menu."""
    await message.answer(
        "👋 Привет! Я бот sabirov.tech.\n"
        "Управляй статусом, веди блог и получай обращения с сайта.",
        reply_markup=get_main_menu(),
    )


@dp.message(Command("menu"))
async def cmd_menu(message: Message):
    """Handle /menu command — show main menu."""
    await message.answer("📋 Главное меню:", reply_markup=get_main_menu())


@dp.message(Command("status"))
async def cmd_status(message: Message):
    """Handle /status command — show bot and owner status info."""
    user_id = message.from_user.id if message.from_user else "Unknown"
    current = await status_service.get_status()
    await message.answer(
        "✅ Бот работает нормально!\n\n"
        f"🔔 Уведомления: Включены\n"
        f"👤 Твой ID: {user_id}\n\n"
        f"Текущий статус на сайте: {current['emoji']} {current['label_ru']}",
        reply_markup=get_main_menu(),
    )


# ---------------------------------------------------------------------------
# Main menu callbacks
# ---------------------------------------------------------------------------

@dp.callback_query(F.data == "menu:back")
async def handle_menu_back(callback: CallbackQuery):
    """Return to main menu."""
    await callback.message.edit_text(
        "📋 Главное меню:",
        reply_markup=get_main_menu(),
    )
    await callback.answer()


@dp.callback_query(F.data == "menu:status")
async def handle_menu_status(callback: CallbackQuery):
    """Show status selection from main menu."""
    current = await status_service.get_status()
    await callback.message.edit_text(
        f"📊 Сейчас: {current['emoji']} {current['label_ru']}\n\n"
        "Выберите статус:",
        reply_markup=get_status_keyboard(),
    )
    await callback.answer()


@dp.callback_query(F.data == "menu:blog")
async def handle_menu_blog(callback: CallbackQuery):
    """Show blog menu."""
    await callback.message.edit_text(
        "📝 Блог — выберите действие:",
        reply_markup=get_blog_menu(),
    )
    await callback.answer()


@dp.callback_query(F.data == "menu:info")
async def handle_menu_info(callback: CallbackQuery):
    """Show current status info."""
    current = await status_service.get_status()
    user_id = callback.from_user.id if callback.from_user else "Unknown"
    await callback.message.edit_text(
        f"ℹ️ Информация\n\n"
        f"✅ Бот работает нормально\n"
        f"👤 Твой ID: <code>{user_id}</code>\n"
        f"🌐 Статус на сайте: {current['emoji']} {current['label_ru']}",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="« Главное меню", callback_data="menu:back")],
        ]),
    )
    await callback.answer()


# ---------------------------------------------------------------------------
# Status management
# ---------------------------------------------------------------------------

@dp.message(Command("setstatus"))
async def cmd_setstatus(message: Message):
    """Show inline keyboard for status selection."""
    current = await status_service.get_status()
    await message.answer(
        f"📊 Текущий статус: {current['emoji']} {current['label_ru']}\n\n"
        "Выберите новый статус:",
        reply_markup=get_status_keyboard(),
    )


@dp.callback_query(F.data.startswith("status:"))
async def handle_status_callback(callback: CallbackQuery):
    """Handle status selection — update text, keep keyboard visible."""
    code = callback.data.split(":", 1)[1]

    if code not in ["online", "away", "busy", "working", "studying", "gaming", "offline"]:
        await callback.answer("❌ Неизвестный статус", show_alert=True)
        return

    current = await status_service.get_status()
    if current["code"] == code:
        await callback.answer("Этот статус уже установлен ✅", show_alert=False)
        return

    try:
        new_status = await status_service.set_status(code)
        await callback.message.edit_text(
            f"✅ Статус обновлён: {new_status['emoji']} {new_status['label_ru']}\n\n"
            "Выберите статус:",
            reply_markup=get_status_keyboard(),
        )
    except ValueError:
        await callback.answer("❌ Неизвестный статус", show_alert=True)
        return
    await callback.answer()


# ---------------------------------------------------------------------------
# Blog — callbacks from main menu
# ---------------------------------------------------------------------------

@dp.callback_query(F.data == "blog:new")
async def handle_blog_new(callback: CallbackQuery, state: FSMContext):
    """Start new blog post from blog menu."""
    await state.set_state(NewPostStates.waiting_for_title)
    await callback.message.edit_text(
        "✍️ Новая заметка.\n\nВведите <b>заголовок</b>:",
        parse_mode="HTML",
    )
    await callback.answer()


@dp.callback_query(F.data == "blog:list")
async def handle_blog_list(callback: CallbackQuery):
    """Show blog posts list from blog menu or post actions."""
    await _send_posts_list(callback.message, edit=True)
    await callback.answer()


# ---------------------------------------------------------------------------
# Blog — /newpost FSM
# ---------------------------------------------------------------------------

@dp.message(Command("newpost"))
async def cmd_newpost(message: Message, state: FSMContext):
    """Start new blog post creation flow."""
    await state.set_state(NewPostStates.waiting_for_title)
    await message.answer(
        "✍️ Новая заметка.\n\n"
        "Введите <b>заголовок</b>:",
        parse_mode="HTML",
    )


@dp.message(NewPostStates.waiting_for_title)
async def handle_post_title(message: Message, state: FSMContext):
    """Receive post title, ask for content."""
    title = message.text.strip() if message.text else ""
    if not title:
        await message.answer("❌ Заголовок не может быть пустым. Попробуйте ещё раз:")
        return
    await state.update_data(title=title)
    await state.set_state(NewPostStates.waiting_for_content)
    await message.answer(
        f"✅ Заголовок: <b>{_escape_html(title)}</b>\n\n"
        "Теперь введите <b>текст</b> заметки (поддерживается Markdown):",
        parse_mode="HTML",
    )


@dp.message(NewPostStates.waiting_for_content)
async def handle_post_content(message: Message, state: FSMContext):
    """Receive post content, show confirmation."""
    content = message.text.strip() if message.text else ""
    if not content:
        await message.answer("❌ Текст не может быть пустым. Попробуйте ещё раз:")
        return
    await state.update_data(content=content)
    await state.set_state(NewPostStates.confirming)

    data = await state.get_data()
    preview = content[:200] + ("…" if len(content) > 200 else "")
    await message.answer(
        f"📋 <b>Предпросмотр</b>\n\n"
        f"<b>{_escape_html(data['title'])}</b>\n\n"
        f"{_escape_html(preview)}\n\n"
        "Что делаем?",
        parse_mode="HTML",
        reply_markup=get_confirm_post_keyboard(data["title"]),
    )


@dp.callback_query(F.data.in_({"post:publish", "post:draft", "post:cancel"}))
async def handle_post_confirm(callback: CallbackQuery, state: FSMContext):
    """Handle post confirmation buttons."""
    action = callback.data.split(":")[1]

    if action == "cancel":
        await state.clear()
        await callback.message.edit_text(
            "❌ Создание заметки отменено.",
            reply_markup=get_blog_menu(),
        )
        await callback.answer()
        return

    data = await state.get_data()
    await state.clear()

    published = action == "publish"

    try:
        from app.database.service import DatabaseService
        db = DatabaseService()
        await db.connect()
        post = await db.create_blog_post(
            title=data["title"],
            content=data["content"],
            published=published,
        )
        await db.disconnect()

        if published:
            await _publish_blog_event({"action": "created", "post": _serialize_post(post)})

        status_text = "опубликована ✅" if published else "сохранена как черновик 📝"
        await callback.message.edit_text(
            f"Заметка <b>{_escape_html(post.title)}</b> {status_text}\n"
            f"Slug: <code>{post.slug}</code>",
            parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="« Блог", callback_data="menu:blog"),
                 InlineKeyboardButton(text="« Меню", callback_data="menu:back")],
            ]),
        )
    except Exception as e:
        logger.exception(f"Failed to save blog post: {e}")
        await callback.message.edit_text(
            "❌ Не удалось сохранить заметку. Попробуйте позже.",
            reply_markup=get_blog_menu(),
        )

    await callback.answer()


# ---------------------------------------------------------------------------
# Blog — /posts management
# ---------------------------------------------------------------------------

@dp.message(Command("posts"))
async def cmd_posts(message: Message):
    """List all blog posts with management buttons."""
    await _send_posts_list(message)


@dp.callback_query(F.data == "posts:list")
async def handle_posts_list(callback: CallbackQuery):
    await _send_posts_list(callback.message, edit=True)
    await callback.answer()


async def _send_posts_list(message: Message, edit: bool = False):
    """Fetch all posts and display as inline keyboard."""
    try:
        from app.database.service import DatabaseService
        db = DatabaseService()
        await db.connect()
        posts = await db.list_all_blog_posts()
        await db.disconnect()
    except Exception as e:
        logger.exception(f"Failed to load posts: {e}")
        nav = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="« Блог", callback_data="menu:blog"),
             InlineKeyboardButton(text="« Меню", callback_data="menu:back")],
        ])
        text = "❌ Не удалось загрузить заметки."
        if edit:
            await message.edit_text(text, reply_markup=nav)
        else:
            await message.answer(text, reply_markup=nav)
        return

    nav_row = [
        InlineKeyboardButton(text="« Блог", callback_data="menu:blog"),
        InlineKeyboardButton(text="« Меню", callback_data="menu:back"),
    ]

    if not posts:
        keyboard = InlineKeyboardMarkup(inline_keyboard=[nav_row])
        text = "📭 Заметок пока нет."
        if edit:
            await message.edit_text(text, reply_markup=keyboard)
        else:
            await message.answer(text, reply_markup=keyboard)
        return

    buttons = [
        [InlineKeyboardButton(
            text=f"{'✅' if p.published else '📝'} {p.title[:40]}",
            callback_data=f"post_view:{str(p.id)}",
        )]
        for p in posts
    ]
    buttons.append(nav_row)
    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
    text = f"📚 Заметки ({len(posts)}):"
    if edit:
        await message.edit_text(text, reply_markup=keyboard)
    else:
        await message.answer(text, reply_markup=keyboard)


@dp.callback_query(F.data.startswith("post_view:"))
async def handle_post_view(callback: CallbackQuery):
    """Show post details and management buttons."""
    post_id = callback.data.split(":", 1)[1]
    try:
        from app.database.service import DatabaseService
        db = DatabaseService()
        await db.connect()
        post = await db.get_blog_post_by_id(post_id)
        await db.disconnect()
    except Exception as e:
        logger.exception(f"Failed to load post {post_id}: {e}")
        await callback.answer("❌ Не удалось загрузить заметку", show_alert=True)
        return

    if post is None:
        await callback.answer("❌ Заметка не найдена", show_alert=True)
        return

    status_label = "Опубликована ✅" if post.published else "Черновик 📝"
    preview = post.content[:300] + ("…" if len(post.content) > 300 else "")
    await callback.message.edit_text(
        f"<b>{_escape_html(post.title)}</b>\n"
        f"<i>{status_label}</i> | <code>{post.slug}</code>\n\n"
        f"{_escape_html(preview)}",
        parse_mode="HTML",
        reply_markup=get_post_actions_keyboard(str(post.id), post.published),
    )
    await callback.answer()


@dp.callback_query(F.data.startswith("post_toggle:"))
async def handle_post_toggle(callback: CallbackQuery):
    """Toggle post publish state."""
    post_id = callback.data.split(":", 1)[1]
    try:
        from app.database.service import DatabaseService
        db = DatabaseService()
        await db.connect()
        post = await db.toggle_blog_post_published(post_id)
        await db.disconnect()
    except Exception as e:
        logger.exception(f"Failed to toggle post {post_id}: {e}")
        await callback.answer("❌ Ошибка", show_alert=True)
        return

    if post.published:
        await _publish_blog_event({"action": "created", "post": _serialize_post(post)})
    else:
        await _publish_blog_event({"action": "deleted", "id": post_id})

    label = "опубликована ✅" if post.published else "скрыта 📝"
    await callback.answer(f"Заметка {label}")
    await _send_posts_list(callback.message, edit=True)


@dp.callback_query(F.data.startswith("post_delete:"))
async def handle_post_delete(callback: CallbackQuery):
    """Delete a post."""
    post_id = callback.data.split(":", 1)[1]
    try:
        from app.database.service import DatabaseService
        db = DatabaseService()
        await db.connect()
        await db.delete_blog_post(post_id)
        await db.disconnect()
    except Exception as e:
        logger.exception(f"Failed to delete post {post_id}: {e}")
        await callback.answer("❌ Ошибка при удалении", show_alert=True)
        return

    await _publish_blog_event({"action": "deleted", "id": post_id})
    await callback.answer("🗑 Заметка удалена")
    await _send_posts_list(callback.message, edit=True)


@dp.callback_query(F.data.startswith("post_edit:"))
async def handle_post_edit_start(callback: CallbackQuery, state: FSMContext):
    """Start edit flow — ask for new content."""
    post_id = callback.data.split(":", 1)[1]
    await state.set_state(EditPostStates.waiting_for_new_content)
    await state.update_data(post_id=post_id)
    await callback.message.edit_text(
        "✏️ Введите новый текст заметки:",
    )
    await callback.answer()


@dp.message(EditPostStates.waiting_for_new_content)
async def handle_post_edit_content(message: Message, state: FSMContext):
    """Save updated content for a post."""
    content = message.text.strip() if message.text else ""
    if not content:
        await message.answer("❌ Текст не может быть пустым. Попробуйте ещё раз:")
        return

    data = await state.get_data()
    post_id = data["post_id"]
    await state.clear()

    try:
        from app.database.service import DatabaseService
        db = DatabaseService()
        await db.connect()
        post = await db.update_blog_post_content(post_id, content)
        await db.disconnect()

        if post.published:
            await _publish_blog_event({"action": "updated", "post": _serialize_post(post)})

        await message.answer(
            "✅ Заметка обновлена!",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="« Блог", callback_data="blog:list"),
                 InlineKeyboardButton(text="« Меню", callback_data="menu:back")],
            ]),
        )
    except Exception as e:
        logger.exception(f"Failed to update post {post_id}: {e}")
        await message.answer(
            "❌ Не удалось обновить заметку.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="« Блог", callback_data="blog:list")],
            ]),
        )


# ---------------------------------------------------------------------------
# Contact notification
# ---------------------------------------------------------------------------

async def send_notification(contact: ContactMessage) -> bool:
    """
    Send a notification about new contact form submission.

    Returns True if successful, False otherwise.
    """
    if bot is None:
        logger.error("Telegram bot not initialized")
        return False

    if not settings.telegram_owner_id:
        logger.error("Telegram owner ID not configured")
        return False

    # Format contacts
    contacts_text = []
    for channel in contact.channels:
        value = getattr(contact.contacts, channel.value, None)
        if value:
            channel_emoji = {
                "email": "📧",
                "telegram": "💬",
                "vk": "💙",
                "phone": "📱",
                "website": "🌐",
                "max": "💜",
                "whatsapp": "📲",
            }.get(channel.value, "📎")

            channel_name = {
                "email": "Email",
                "telegram": "Telegram",
                "vk": "VK",
                "phone": "Телефон",
                "website": "Сайт",
                "max": "MAX",
                "whatsapp": "WhatsApp",
            }.get(channel.value, channel.value)

            if channel.value == "telegram" and not value.startswith("@"):
                value = f"@{value}"

            contacts_text.append(f"{channel_emoji} {channel_name}: {value}")

    timestamp = contact.created_at.strftime("%d.%m.%Y %H:%M")

    text = (
        f"📬 <b>Новая заявка с сайта!</b>\n\n"
        f"👤 <b>Имя:</b> {_escape_html(contact.name)}\n\n"
        f"📝 <b>Сообщение:</b>\n{_escape_html(contact.message)}\n\n"
        f"📞 <b>Способы связи:</b>\n"
    )
    text += "\n".join(f"• {c}" for c in contacts_text)
    text += f"\n\n🕐 {timestamp}"

    try:
        await bot.send_message(
            chat_id=settings.telegram_owner_id,
            text=text,
            parse_mode="HTML",
        )
        logger.info(f"Notification sent for contact {contact.id}")
        return True
    except Exception as e:
        logger.exception(f"Failed to send Telegram notification: {e}")
        return False


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize_post(post) -> dict:
    """Serialize a BlogPost ORM object to a JSON-safe dict for pub/sub."""
    return {
        "id": str(post.id),
        "title": post.title,
        "content": post.content,
        "slug": post.slug,
        "published": post.published,
        "created_at": post.created_at.isoformat(),
        "updated_at": post.updated_at.isoformat(),
    }


async def _publish_blog_event(event: dict) -> None:
    """Publish a blog update event to Redis pub/sub. Silently ignores errors."""
    if status_service._redis is None:
        return
    try:
        await status_service._redis.publish(BLOG_PUBSUB_CHANNEL, json.dumps(event))
    except Exception as e:
        logger.warning(f"Failed to publish blog event: {e}")


def _escape_html(text: str) -> str:
    """Escape HTML special characters."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------------------------------------------------------------------------
# Long polling lifecycle (one backend replica; worker uses a separate process/Bot)
# ---------------------------------------------------------------------------

async def start_telegram_polling() -> None:
    """Clear Telegram webhook if set and run dispatcher polling in the background."""
    global _polling_task
    if bot is None:
        logger.warning("Telegram bot not initialized, skipping polling")
        return
    if _polling_task is not None:
        logger.warning("Telegram polling already started")
        return

    try:
        await bot.delete_webhook(drop_pending_updates=False)
    except Exception:
        logger.exception(
            "Failed to delete Telegram webhook before polling; continuing anyway",
        )

    _polling_task = asyncio.create_task(dp.start_polling(bot))
    logger.info("Telegram long polling started")


async def stop_telegram_polling() -> None:
    """Stop long polling and close the bot HTTP session."""
    global _polling_task
    if bot is None:
        return

    try:
        await dp.stop_polling()
    except Exception:
        logger.exception("Error stopping Telegram dispatcher polling")

    if _polling_task is not None:
        try:
            await _polling_task
        except asyncio.CancelledError:
            pass
        _polling_task = None

    try:
        await bot.session.close()
    except Exception:
        logger.exception("Error closing Telegram bot session")

    logger.info("Telegram long polling stopped")
