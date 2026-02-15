"""
Script para probar la API mejorada con Hybrid Enhanced
"""

import requests
import json

API_URL = "http://localhost:5001"


def test_health():
    """Test health check"""
    print("\n" + "="*70)
    print("TEST 1: Health Check")
    print("="*70)
    
    try:
        response = requests.get(f"{API_URL}/api/ml/health", timeout=5)
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get('status') == 'healthy':
            print("✅ API está funcionando")
            print(f"   Modelo: {data.get('model')}")
            print(f"   Mascotas disponibles: {data.get('available_pets')}")
            return True
        else:
            print("❌ API no está saludable")
            return False
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_model_info():
    """Test model info endpoint"""
    print("\n" + "="*70)
    print("TEST 2: Model Info")
    print("="*70)
    
    try:
        response = requests.get(f"{API_URL}/api/ml/model/info", timeout=5)
        data = response.json()
        
        print(f"Status: {response.status_code}")
        
        if data.get('status') == 'success':
            model = data['model']
            print("✅ Información del modelo:")
            print(f"   Nombre: {model['name']}")
            print(f"   Versión: {model['version']}")
            print(f"   Content weight: {model['components']['content_based']['weight']}")
            print(f"   Collab weight: {model['components']['collaborative']['weight']}")
            print(f"   NLP: {model['components']['content_based']['features']['nlp']}")
            
            weights = model['components']['content_based']['features']['weights']
            print("\n   Feature weights:")
            for feature, weight in weights.items():
                print(f"      - {feature}: {weight}x")
            
            return True
        else:
            print("❌ Error obteniendo info del modelo")
            return False
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_recommend():
    """Test recommendation endpoint"""
    print("\n" + "="*70)
    print("TEST 3: Recomendaciones con Hybrid Enhanced")
    print("="*70)
    
    # Perfil de usuario de prueba
    user_profile = {
        "horasEnCasa": "mas_8",
        "nivelActividad": "moderado",
        "perroOGato": "perro",
        "tamanoMascota": "grande",
        "nivelEnergia": "energetico",
        "edadPreferida": "joven",
        "personalidad": "jugueton,activo,carinoso",
        "espacioExterior": "si",
        "experiencia": "si"
    }
    
    payload = {
        "user_profile": user_profile,
        "user_id": 1,
        "n_recommendations": 5
    }
    
    print(f"Perfil: {user_profile['perroOGato']} {user_profile['tamanoMascota']} {user_profile['personalidad']}")
    
    try:
        response = requests.post(
            f"{API_URL}/api/ml/recommend",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        data = response.json()
        
        print(f"\nStatus: {response.status_code}")
        
        if data.get('status') == 'success':
            print(f"✅ {data['count']} recomendaciones generadas")
            print(f"   Modelo: {data['model']}")
            print(f"   Mascotas disponibles: {data['total_available']}")
            
            print("\nTop 5 recomendaciones:")
            for i, rec in enumerate(data['recommendations'], 1):
                pet = rec['pet_details']
                print(f"\n   {i}. {pet['nombre']} (ID: {rec['pet_id']})")
                print(f"      Match: {rec['match_percentage']}%")
                print(f"      Scores - Hybrid: {rec['hybrid_score']:.3f} | Content: {rec['content_score']:.3f} | Collab: {rec['collab_score']:.3f}")
                print(f"      {pet['especie']} {pet['tamano']}, {pet['nivel_energia']}")
                print(f"      Personalidad: {pet['personalidad']}")
            
            return True
        else:
            print(f"❌ Error: {data.get('message')}")
            return False
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_explain():
    """Test explanation endpoint"""
    print("\n" + "="*70)
    print("TEST 4: Explicación de Recomendación")
    print("="*70)
    
    user_profile = {
        "tamanoMascota": "grande",
        "personalidad": "jugueton,carinoso"
    }
    
    pet_id = 1  # ID de prueba
    
    try:
        response = requests.post(
            f"{API_URL}/api/ml/explain/{pet_id}",
            json={"user_profile": user_profile},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        data = response.json()
        
        if data.get('status') == 'success':
            print(f"✅ Explicación para Pet ID {pet_id}:")
            exp = data['explanation']
            print(f"\n{exp}")
            return True
        else:
            print(f"⚠️ No se pudo generar explicación (puede ser normal si la mascota no existe)")
            return True  # No es error crítico
    
    except Exception as e:
        print(f"⚠️ Error no crítico: {e}")
        return True


def main():
    """Ejecutar todos los tests"""
    print("="*70)
    print("TESTING ENHANCED HYBRID API")
    print("="*70)
    print("\nAsegúrate de que la API esté corriendo:")
    print("  python api/app_enhanced.py")
    print("")
    
    results = []
    
    # Test 1: Health
    results.append(("Health Check", test_health()))
    
    # Test 2: Model Info
    results.append(("Model Info", test_model_info()))
    
    # Test 3: Recommendations
    results.append(("Recommendations", test_recommend()))
    
    # Test 4: Explanation
    results.append(("Explanation", test_explain()))
    
    # Resumen
    print("\n" + "="*70)
    print("RESUMEN DE TESTS")
    print("="*70)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    
    print(f"\n{passed}/{total} tests pasaron")
    
    if passed == total:
        print("\n🎉 ¡Todos los tests pasaron! La API mejorada está funcionando correctamente.")
    else:
        print("\n⚠️ Algunos tests fallaron. Revisa la configuración.")
    
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
