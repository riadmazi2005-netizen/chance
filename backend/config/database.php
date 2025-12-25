<?php
class Database {
    private $host = "localhost";
    private $port = "3306"; // Changement ici selon votre XAMPP
    private $db_name = "transport_scolaire";
    private $username = "root";
    private $password = "";
    public $conn;

    // Cette méthode est appelée par votre fichier admin_login.php
    public function connect() {
        return $this->getConnection();
    }

    public function getConnection() {
        $this->conn = null;
        try {
            // Ajout du port dans la chaîne DSN
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8mb4");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            // En cas d'erreur, on renvoie un JSON propre pour le front-end
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erreur de connexion : " . $exception->getMessage()]);
            exit();
        }
        return $this->conn;
    }
}
?>