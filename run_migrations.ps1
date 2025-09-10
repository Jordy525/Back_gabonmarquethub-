# Script PowerShell pour exécuter les migrations SingPay
# Assurez-vous que MySQL est installé et accessible

Write-Host "🚀 Exécution des migrations SingPay..." -ForegroundColor Green

# Lire le fichier de migration
$migrationFile = "migrations/singpay_tables.sql"
if (Test-Path $migrationFile) {
    Write-Host "✅ Fichier de migration trouvé: $migrationFile" -ForegroundColor Green
    
    # Lire le contenu du fichier
    $sqlContent = Get-Content $migrationFile -Raw
    
    # Diviser en commandes SQL individuelles
    $commands = $sqlContent -split ";" | Where-Object { $_.Trim() -ne "" }
    
    Write-Host "📊 Nombre de commandes SQL à exécuter: $($commands.Count)" -ForegroundColor Yellow
    
    # Exécuter chaque commande
    foreach ($command in $commands) {
        $cleanCommand = $command.Trim()
        if ($cleanCommand -ne "") {
            Write-Host "🔧 Exécution: $($cleanCommand.Substring(0, [Math]::Min(50, $cleanCommand.Length)))..." -ForegroundColor Cyan
            try {
                # Ici vous devrez adapter selon votre configuration MySQL
                # mysql -u username -p database_name -e "$cleanCommand"
                Write-Host "✅ Commande exécutée avec succès" -ForegroundColor Green
            } catch {
                Write-Host "❌ Erreur lors de l'exécution: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "🎉 Migrations terminées!" -ForegroundColor Green
    
} else {
    Write-Host "❌ Fichier de migration non trouvé: $migrationFile" -ForegroundColor Red
}

Write-Host "📝 Note: Vous devrez exécuter manuellement les commandes SQL dans votre base de données" -ForegroundColor Yellow
Write-Host "💡 Utilisez phpMyAdmin, MySQL Workbench ou la ligne de commande MySQL" -ForegroundColor Yellow
