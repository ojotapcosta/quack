// Configuração do Supabase
const supabaseUrl = 'https://btzethomxlxzmbrywgaf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0emV0aG9teGx4em1icnl3Z2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3OTYyNDAsImV4cCI6MjA2NTM3MjI0MH0.1Lm7r7L-gUtbCP9zsZH8eG-g46DtHpETqTVf5T961og'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// Elementos do DOM
const form = document.getElementById('share-form')
const fromInput = document.getElementById('from-input')
const toInput = document.getElementById('to-input')
const emailInput = document.getElementById('email-input')
const textInput = document.getElementById('text-input')
const imageInput = document.getElementById('image-input')
const previewContainer = document.getElementById('preview')

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
    
    const from = fromInput.value.trim()
    const to = toInput.value.trim()
    const email = emailInput.value.trim()
    const text = textInput.value.trim()

    if (!from || !to || !email || (!text && !selectedImage)) {
        alert('Por favor, preencha todos os campos obrigatórios')
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
                from_name: from,
                to_name: to,
                email: email,
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
        fromInput.value = ''
        toInput.value = ''
        emailInput.value = ''
        textInput.value = ''
        imageInput.value = ''
        previewContainer.innerHTML = ''
        selectedImage = null

        // Exibir pop-up de confirmação
        alert('Mensagem enviada com sucesso! Obrigado por compartilhar seu amor 💖')

    } catch (error) {
        console.error('Erro completo:', error)
        alert('Erro ao enviar post. Verifique o console para mais detalhes.')
    }
}) 