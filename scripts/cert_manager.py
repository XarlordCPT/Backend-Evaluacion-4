import os
import sys
from datetime import datetime, timedelta, timezone
from OpenSSL import crypto

def generate_self_signed_cert(cert_dir, key_file="server.key", cert_file="server.crt", days_valid=365):
    """
    Genera un certificado autofirmado y su clave privada.
    """
    # Crear par de claves
    k = crypto.PKey()
    k.generate_key(crypto.TYPE_RSA, 2048)

    # Crear certificado
    cert = crypto.X509()
    cert.get_subject().C = "CL"
    cert.get_subject().ST = "Santiago"
    cert.get_subject().L = "Santiago"
    cert.get_subject().O = "NUAM Project"
    cert.get_subject().OU = "Development"
    cert.get_subject().CN = "localhost"
    
    # Configurar número de serie y tiempos de validez
    cert.set_serial_number(1000)
    cert.gmtime_adj_notBefore(0)
    cert.gmtime_adj_notAfter(days_valid * 24 * 60 * 60)
    
    # Asignar clave pública y firmar
    cert.set_issuer(cert.get_subject())
    cert.set_pubkey(k)
    cert.sign(k, 'sha256')

    # Guardar archivos
    if not os.path.exists(cert_dir):
        os.makedirs(cert_dir)
        
    key_path = os.path.join(cert_dir, key_file)
    cert_path = os.path.join(cert_dir, cert_file)

    with open(cert_path, "wb") as f:
        f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, cert))
        
    with open(key_path, "wb") as f:
        f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, k))
        
    print(f"[CertManager] Certificados generados exitosamente en: {cert_dir}")
    return True

def check_cert_validity(cert_path, min_days=30):
    """
    Verifica si el certificado es válido y no expira pronto.
    """
    try:
        with open(cert_path, "rb") as f:
            cert_data = f.read()
            cert = crypto.load_certificate(crypto.FILETYPE_PEM, cert_data)
            
            # Obtener fecha de expiración
            not_after_str = cert.get_notAfter().decode('ascii')
            not_after = datetime.strptime(not_after_str, '%Y%m%d%H%M%SZ').replace(tzinfo=timezone.utc)
            remaining = not_after - datetime.now(timezone.utc)
            
            if remaining.days < min_days:
                print(f"[CertManager] El certificado expira en {remaining.days} días. Se requiere renovación.")
                return False
                
            print(f"[CertManager] Certificado válido. Expira en {remaining.days} días.")
            return True
            
    except Exception as e:
        print(f"[CertManager] Error verificando certificado: {e}")
        return False

def main():
    # Directorio raíz del proyecto (padre de 'scripts')
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cert_dir = os.path.join(base_dir, 'certs')
    
    cert_path = os.path.join(cert_dir, "server.crt")
    key_path = os.path.join(cert_dir, "server.key")
    
    print("--- [CertManager] Iniciando verificación de certificados SSL ---")
    
    should_generate = False
    
    if not os.path.exists(cert_path) or not os.path.exists(key_path):
        print("[CertManager] No se encontraron certificados.")
        should_generate = True
    else:
        if not check_cert_validity(cert_path):
            should_generate = True
            
    if should_generate:
        print("[CertManager] Generando nuevos certificados...")
        generate_self_signed_cert(cert_dir)
    else:
        print("[CertManager] Los certificados actuales son válidos.")
        
    print("--- [CertManager] Verificación completada ---")

if __name__ == "__main__":
    main()
