// Removido: import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://btzethomxlxzmbrywgaf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0emV0aG9teGx4em1icnl3Z2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3OTYyNDAsImV4cCI6MjA2NTM3MjI0MH0.1Lm7r7L-gUtbCP9zsZH8eG-g46DtHpETqTVf5T961og'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// Elementos do DOM
const form = document.getElementById('share-form')
const textInput = document.getElementById('text-input')
const imageInput = document.getElementById('image-input')
const previewContainer = document.getElementById('preview')
const postsContainer = document.getElementById('posts')

// Variáveis globais
let selectedImage = null

// Preview da imagem
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (file) {
        selectedImage = file
        const reader = new FileReader()
        reader.onload = (e) => {
            previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview">`
        }
        reader.readAsDataURL(file)
    }
})

// Envio do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const text = textInput.value.trim()
    if (!text && !selectedImage) {
        alert('Por favor, digite uma mensagem ou selecione uma imagem')
        return
    }

    try {
        let imageUrl = null
        
        // Upload da imagem se existir
        if (selectedImage) {
            console.log('Iniciando upload da imagem...')
            const { data: imageData, error: imageError } = await supabase.storage
                .from('images')
                .upload(`${Date.now()}-${selectedImage.name}`, selectedImage)
            
            if (imageError) {
                console.error('Erro no upload da imagem:', imageError)
                throw imageError
            }
            
            console.log('Imagem enviada com sucesso:', imageData)
            
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(imageData.path)
            
            imageUrl = publicUrl
            console.log('URL pública da imagem:', publicUrl)
        }

        // Salvar post no banco
        console.log('Salvando post no banco...')
        const { data, error } = await supabase
            .from('posts')
            .insert([{
                text,
                image_url: imageUrl,
                created_at: new Date().toISOString()
            }])
            .select()

        if (error) {
            console.error('Erro ao salvar post:', error)
            throw error
        }

        console.log('Post salvo com sucesso:', data)

        // Limpar formulário
        textInput.value = ''
        imageInput.value = ''
        previewContainer.innerHTML = ''
        selectedImage = null

    } catch (error) {
        console.error('Erro completo:', error)
        alert('Erro ao enviar post. Verifique o console para mais detalhes.')
    }
})

// Função para renderizar posts
function renderPost(post) {
    const postElement = document.createElement('div')
    postElement.className = 'post'
    
    const time = new Date(post.created_at).toLocaleString('pt-BR')
    
    postElement.innerHTML = `
        ${post.text ? `<div class="post-text">${post.text}</div>` : ''}
        ${post.image_url ? `<img src="${post.image_url}" alt="Post image">` : ''}
        <div class="post-time">${time}</div>
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