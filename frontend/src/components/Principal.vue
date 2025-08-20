<template>
    <div class="principal">
        <nav class="navbar">
            <ul>
                <li><router-link to="/principal" class="nav-link" exact>Principal</router-link></li>
                <li><router-link to="/mis-carros" class="nav-link">Mis Carros</router-link></li>
                <li><router-link to="/agregar-carro" class="nav-link">Agregar Carros</router-link></li>
            </ul>
        </nav>
        <header>
            <h1>Bienvenido a la Página Principal</h1>
        </header>
        <main>
            <p>Encuentra tus carros en cualquier lugar donde esten guardados.</p>
            <p>Utiliza el menú de navegación para acceder a las diferentes secciones.</p
            </p>
        </main>
    </div>
</template>

<script>
export default {
    name: 'Principal'
}
</script>

<style scoped>
.principal {
    max-width: 600px;
    margin: 40px auto;
    padding: 24px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fafafa;
    text-align: center;
}

.navbar {
    width: 100%;
    background: #42b983;
    border-radius: 6px 6px 0 0;
    margin-bottom: 24px;
    padding: 0;
}

.navbar ul {
    list-style: none;
    display: flex;
    justify-content: center;
    margin: 0;
    padding: 0;
}

.navbar li {
    margin: 0 16px;
}

.nav-link {
    color: #fff;
    text-decoration: none;
    font-weight: bold;
    padding: 12px 8px;
    display: block;
    transition: background 0.2s;
    border-radius: 4px;
}

.nav-link.router-link-exact-active,
.nav-link.router-link-active {
    background: #369870;
}

header h1 {
    margin-bottom: 16px;
    color: #333;
}
p {
    color: #555;
    font-size: 16px;
}
</style>