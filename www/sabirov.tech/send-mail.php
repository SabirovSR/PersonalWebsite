<?php
/**
 * Contact Form Handler
 * Обработчик формы обратной связи для sabirov.tech
 */

// Настройки
$recipient_email = 'savelij.sabirov.2016@gmail.com'; // Email для получения сообщений
$site_name = 'sabirov.tech';

// Заголовки для JSON ответа
header('Content-Type: application/json; charset=utf-8');

// Только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit;
}

// Получение и валидация данных
$name = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
$email = isset($_POST['email']) ? trim(strip_tags($_POST['email'])) : '';
$message = isset($_POST['message']) ? trim(strip_tags($_POST['message'])) : '';

// Валидация
$errors = [];

if (empty($name)) {
    $errors[] = 'Имя обязательно для заполнения';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Введите корректный email';
}

if (empty($message)) {
    $errors[] = 'Сообщение обязательно для заполнения';
}

// Защита от спама - проверка длины
if (strlen($message) > 5000) {
    $errors[] = 'Сообщение слишком длинное';
}

if (strlen($name) > 100) {
    $errors[] = 'Имя слишком длинное';
}

// Если есть ошибки - возвращаем их
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit;
}

// Формирование письма
$subject = "Новое сообщение с сайта {$site_name}";

$body = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #00ff88, #00d4ff); padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { color: #0a0a0f; margin: 0; font-size: 24px; }
        .content { background: #15151f; padding: 30px; border-radius: 0 0 8px 8px; color: #f0f0f5; }
        .field { margin-bottom: 20px; }
        .label { color: #00ff88; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .value { font-size: 16px; line-height: 1.6; }
        .footer { text-align: center; padding: 20px; color: #8b8b9a; font-size: 12px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>📧 Новое сообщение</h1>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='label'>Имя отправителя</div>
                <div class='value'>" . htmlspecialchars($name) . "</div>
            </div>
            <div class='field'>
                <div class='label'>Email</div>
                <div class='value'><a href='mailto:" . htmlspecialchars($email) . "' style='color: #00d4ff;'>" . htmlspecialchars($email) . "</a></div>
            </div>
            <div class='field'>
                <div class='label'>Сообщение</div>
                <div class='value'>" . nl2br(htmlspecialchars($message)) . "</div>
            </div>
        </div>
        <div class='footer'>
            Отправлено с сайта {$site_name}
        </div>
    </div>
</body>
</html>
";

// Заголовки письма
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: ' . $site_name . ' <noreply@' . $_SERVER['HTTP_HOST'] . '>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion()
];

// Отправка письма
$mail_sent = @mail($recipient_email, $subject, $body, implode("\r\n", $headers));

// Логирование попытки отправки
$log_dir = __DIR__ . '/../logs';
if (!is_dir($log_dir)) {
    @mkdir($log_dir, 0755, true);
}

$log_file = $log_dir . '/contact_form.log';
$log_entry = date('Y-m-d H:i:s') . " | {$name} | {$email} | " . ($mail_sent ? 'Успешно' : 'Ошибка') . "\n";
@file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);

if ($mail_sent) {
    echo json_encode(['success' => true, 'message' => 'Сообщение успешно отправлено']);
} else {
    http_response_code(500);
    
    // Дополнительная информация для отладки (только в лог, не пользователю)
    $error_log = date('Y-m-d H:i:s') . " | Ошибка mail(): " . error_get_last()['message'] . "\n";
    @file_put_contents($log_file, $error_log, FILE_APPEND | LOCK_EX);
    
    echo json_encode([
        'success' => false, 
        'message' => 'Не удалось отправить сообщение через сервер. Попробуйте написать напрямую на email.'
    ]);
}
