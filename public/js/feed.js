// Configuração do Supabase
const supabaseUrl = 'https://btzethomxlxzmbrywgaf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0emV0aG9teGx4em1icnl3Z2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3OTYyNDAsImV4cCI6MjA2NTM3MjI0MH0.1Lm7r7L-gUtbCP9zsZH8eG-g46DtHpETqTVf5T961og'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// Elementos do DOM
const postsContainer = document.getElementById('posts')

// Função para renderizar posts
function renderPost(post) {
    const postElement = document.createElement('div')
    postElement.className = 'post'
    
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-from">De: ${post.from_name}</div>
            <div class="post-to">Para: ${post.to_name}</div>
        </div>
        ${post.text ? `<div class="post-text">${post.text}</div>` : ''}
        ${post.image_url ? `<img src="${post.image_url}" alt="Post image">` : ''}
    `
    
    return postElement
}

// Carregar posts iniciais
async function loadPosts() {
    try {
        console.log('Carregando posts...')
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erro ao carregar posts:', error)
            throw error
        }

        console.log('Posts carregados:', data)

        postsContainer.innerHTML = ''
        if (data && data.length > 0) {
            data.forEach(post => {
                postsContainer.appendChild(renderPost(post))
            })
        } else {
            postsContainer.innerHTML = '<p class="no-posts">Nenhum post ainda. Seja o primeiro a compartilhar!</p>'
        }
    } catch (error) {
        console.error('Erro ao carregar posts:', error)
        postsContainer.innerHTML = '<p class="error">Erro ao carregar posts. Por favor, recarregue a página.</p>'
    }
}

// Inscrição para atualizações em tempo real
console.log('Configurando realtime...')
const channel = supabase
    .channel('posts_changes')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
            console.log('Nova mensagem recebida:', payload)
            const newPost = payload.new
            postsContainer.insertBefore(
                renderPost(newPost),
                postsContainer.firstChild
            )
        }
    )
    .subscribe((status) => {
        console.log('Status da inscrição realtime:', status)
    })

// Carregar posts iniciais
loadPosts() 