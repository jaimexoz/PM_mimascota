# Script de prueba para la API Flask
# Asegúrate de tener el servidor corriendo: python api/app.py

import requests
import json

API_URL = "http://localhost:5001"

def test_health():
    """Prueba el endpoint de health check"""
    print("🔍 Testing /health endpoint...")
    
    response = requests.get(f"{API_URL}/api/ml/health")
    
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {response.json()}")
    print()


def test_recommend_new_user():
    """Prueba recomendación para usuario nuevo"""
    print("🔍 Testing /recommend for NEW user...")
    
    # Usuario de prueba (sin user_id para simular nuevo usuario)
    payload = {
        "user_profile": {
            "horasEnCasa": "mas_8",
            "nivelActividad": "activo",
            "experienciaMascotas": "moderada",
            "tipoVivienda": "casa_jardin",
            "tamanoMascota": "grande",
            "edadPreferida": "adulto",
            "perroOGato": "solo_perros",
            "nivelEnergia": "energetico",
            "personalidad": "amigable,jugueton,cariñoso",
            "ninosEnCasa": "no",
            "otrasMascotas": "no",
            "tiempoCuidado": "mas_2",
            "entrenamiento": "si",
            "presupuesto": "alto"
        },
        "n_recommendations": 5
    }
    
    response = requests.post(
        f"{API_URL}/api/ml/recommend",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   Status: {data['status']}")
        print(f"   Recommendations: {data['count']}")
        print()
        
        for i, rec in enumerate(data['recommendations'], 1):
            print(f"   {i}. Pet ID {rec['pet_id']:3d} | "
                  f"Match: {rec['match_percentage']:3d}% | "
                  f"{rec['pet_details']['especie']:5s} | "
                  f"{rec['pet_details']['tamano']:10s}")
    else:
        print(f"   Error: {response.text}")
    
    print()


def test_recommend_existing_user():
    """Prueba recomendación para usuario existente"""
    print("🔍 Testing /recommend for EXISTING user...")
    
    payload = {
        "user_id": 1,  # Usuario existente
        "user_profile": {
            "horasEnCasa": "6_8",
            "nivelActividad": "moderado",
            "experienciaMascotas": "moderada",
            "tipoVivienda": "apto_grande",
            "tamanoMascota": "mediano",
            "edadPreferida": "joven",
            "perroOGato": "solo_gatos",
            "nivelEnergia": "moderado",
            "personalidad": "tranquilo,independiente",
            "ninosEnCasa": "no",
            "otrasMascotas": "no",
            "tiempoCuidado": "1_2",
            "entrenamiento": "tal_vez",
            "presupuesto": "moderado"
        },
        "n_recommendations": 5
    }
    
    response = requests.post(
        f"{API_URL}/api/ml/recommend",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   Status: {data['status']}")
        print(f"   Hybrid Recommendations: {data['count']}")
        print()
        
        for i, rec in enumerate(data['recommendations'], 1):
            print(f"   {i}. Pet ID {rec['pet_id']:3d} | "
                  f"Hybrid: {rec['hybrid_score']:.3f} | "
                  f"Content: {rec['content_score']:.3f} | "
                  f"Collab: {rec['collab_score']:.3f}")
    else:
        print(f"   Error: {response.text}")
    
    print()


def main():
    print("=" * 70)
    print("🧪 PRUEBA DE API ML")
    print("=" * 70)
    print()
    
    try:
        # 1. Health check
        test_health()
        
        # 2. Usuario nuevo (solo content-based)
        test_recommend_new_user()
        
        # 3. Usuario existente (híbrido)
        test_recommend_existing_user()
        
        print("=" * 70)
        print("✅ TODAS LAS PRUEBAS COMPLETADAS")
        print("=" * 70)
    
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se pudo conectar con el servidor")
        print("   Asegúrate de que el servidor esté corriendo:")
        print("   python api/app.py")
    
    except Exception as e:
        print(f"❌ Error inesperado: {e}")


if __name__ == "__main__":
    main()
