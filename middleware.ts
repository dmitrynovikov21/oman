import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Временно отключаем авторизацию для тестирования
export function middleware(request: NextRequest) {
    // Пропускаем все запросы без проверки
    return NextResponse.next();
}

// Можно настроить какие пути проверять (сейчас не используется)
export const config = {
    matcher: [
        // Пусто - ничего не проверяем
    ],
};