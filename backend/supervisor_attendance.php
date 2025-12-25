<?php
// supervisor_attendance.php - Gestion des présences des élèves
require_once 'config.php';

// GET - Récupérer les présences
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['supervisor_id']) || !isset($_GET['date']) || !isset($_GET['period'])) {
        sendError('Paramètres manquants (supervisor_id, date, period)');
    }

    $supervisorId = $_GET['supervisor_id'];
    $date = $_GET['date'];
    $period = $_GET['period'];

    try {
        // Récupérer le bus du superviseur
        $stmt = $pdo->prepare("
            SELECT id, bus_id FROM buses WHERE supervisor_id = :supervisor_id LIMIT 1
        ");
        $stmt->execute(['supervisor_id' => $supervisorId]);
        $bus = $stmt->fetch();

        if (!$bus) {
            sendResponse(['students' => [], 'attendance' => [], 'bus' => null]);
            exit;
        }

        // Récupérer les élèves du bus
        $stmt = $pdo->prepare("
            SELECT 
                s.id,
                s.first_name as firstName,
                s.last_name as lastName,
                s.class,
                s.age,
                s.gender,
                s.zone as quarter,
                s.bus_group as busGroup,
                s.absence_count as absenceCount,
                s.tutor_id as tutorId,
                ut.phone as tutorPhone,
                CONCAT(ut.first_name, ' ', ut.last_name) as tutorName
            FROM students s
            INNER JOIN tutors t ON s.tutor_id = t.id
            INNER JOIN users ut ON t.user_id = ut.id
            WHERE s.bus_id = :bus_id AND s.status = 'approved'
            ORDER BY s.last_name, s.first_name
        ");
        $stmt->execute(['bus_id' => $bus['id']]);
        $students = $stmt->fetchAll();

        // Récupérer les présences pour cette date et période
        $stmt = $pdo->prepare("
            SELECT 
                student_id as studentId,
                status,
                bus_group as busGroup
            FROM attendance
            WHERE bus_id = :bus_id AND date = :date AND period = :period
        ");
        $stmt->execute([
            'bus_id' => $bus['id'],
            'date' => $date,
            'period' => $period
        ]);
        $attendance = $stmt->fetchAll();

        // Créer un map des présences
        $attendanceMap = [];
        foreach ($attendance as $att) {
            $attendanceMap[$att['studentId']] = $att['status'];
        }

        sendResponse([
            'students' => $students,
            'attendance' => $attendanceMap,
            'bus' => [
                'id' => $bus['id'],
                'busId' => $bus['bus_id']
            ]
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des présences', 500);
    }
}

// POST - Marquer une présence
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['supervisor_id']) || !isset($input['student_id']) || 
        !isset($input['bus_id']) || !isset($input['date']) || 
        !isset($input['period']) || !isset($input['status'])) {
        sendError('Données incomplètes');
    }

    try {
        $pdo->beginTransaction();

        // Vérifier que le bus appartient au superviseur
        $stmt = $pdo->prepare("
            SELECT id FROM buses WHERE id = :bus_id AND supervisor_id = :supervisor_id
        ");
        $stmt->execute([
            'bus_id' => $input['bus_id'],
            'supervisor_id' => $input['supervisor_id']
        ]);

        if (!$stmt->fetch()) {
            sendError('Bus non autorisé', 403);
        }

        // Récupérer les infos de l'élève
        $stmt = $pdo->prepare("
            SELECT 
                s.*,
                ut.first_name as tutor_first_name,
                ut.last_name as tutor_last_name
            FROM students s
            INNER JOIN tutors t ON s.tutor_id = t.id
            INNER JOIN users ut ON t.user_id = ut.id
            WHERE s.id = :student_id
        ");
        $stmt->execute(['student_id' => $input['student_id']]);
        $student = $stmt->fetch();

        if (!$student) {
            sendError('Élève non trouvé', 404);
        }

        // Vérifier si une présence existe déjà
        $stmt = $pdo->prepare("
            SELECT id FROM attendance 
            WHERE student_id = :student_id 
            AND bus_id = :bus_id 
            AND date = :date 
            AND period = :period
        ");
        $stmt->execute([
            'student_id' => $input['student_id'],
            'bus_id' => $input['bus_id'],
            'date' => $input['date'],
            'period' => $input['period']
        ]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Mettre à jour
            $stmt = $pdo->prepare("
                UPDATE attendance 
                SET status = :status 
                WHERE id = :id
            ");
            $stmt->execute([
                'status' => $input['status'],
                'id' => $existing['id']
            ]);
        } else {
            // Créer
            $attendanceId = generateUUID();
            $stmt = $pdo->prepare("
                INSERT INTO attendance (
                    id, student_id, bus_id, date, period, status, bus_group, marked_by
                ) VALUES (
                    :id, :student_id, :bus_id, :date, :period, :status, :bus_group, :marked_by
                )
            ");
            $stmt->execute([
                'id' => $attendanceId,
                'student_id' => $input['student_id'],
                'bus_id' => $input['bus_id'],
                'date' => $input['date'],
                'period' => $input['period'],
                'status' => $input['status'],
                'bus_group' => $student['bus_group'],
                'marked_by' => $input['supervisor_id']
            ]);
        }

        // Si absence, mettre à jour le compteur et notifier le tuteur
        if ($input['status'] === 'absent') {
            // Mettre à jour le compteur d'absences
            $newAbsenceCount = ((int)$student['absence_count']) + 1;
            $stmt = $pdo->prepare("
                UPDATE students SET absence_count = :count WHERE id = :id
            ");
            $stmt->execute([
                'count' => $newAbsenceCount,
                'id' => $input['student_id']
            ]);

            // Récupérer les infos du bus pour la notification
            $stmt = $pdo->prepare("SELECT bus_id FROM buses WHERE id = :id");
            $stmt->execute(['id' => $input['bus_id']]);
            $busInfo = $stmt->fetch();

            // Créer notification pour le tuteur
            $notifId = generateUUID();
            $periodText = $input['period'] === 'morning' ? 'Matin' : 'Soir';
            $dateFormatted = date('d/m/Y', strtotime($input['date']));
            
            $stmt = $pdo->prepare("
                INSERT INTO notifications (
                    id, recipient_id, recipient_type, sender_id, sender_type,
                    type, title, message
                ) VALUES (
                    :id, :recipient_id, 'tutor', :sender_id, 'supervisor',
                    'absence', :title, :message
                )
            ");
            $stmt->execute([
                'id' => $notifId,
                'recipient_id' => $student['tutor_id'],
                'sender_id' => $input['supervisor_id'],
                'title' => 'Absence de votre enfant',
                'message' => $student['first_name'] . ' ' . $student['last_name'] . 
                            ' a été marqué(e) absent(e) dans le bus ' . $busInfo['bus_id'] . 
                            ' le ' . $dateFormatted . ' (' . $periodText . ')'
            ]);
        }

        $pdo->commit();

        sendResponse([
            'success' => true,
            'message' => $input['status'] === 'present' ? 'Présence enregistrée' : 'Absence enregistrée et tuteur notifié'
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de l\'enregistrement', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>