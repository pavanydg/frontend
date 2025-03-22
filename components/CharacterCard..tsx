import { useRouter } from "next/navigation"

export function CharacterCard({id, name, prompt, profile_image_url}) {
    const router = useRouter();
    return (
        <div className="border w-48 p-4 border-gray-600 rounded-xl"
        onClick={() => router.push(`dashboard/${id}`)}
        style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=2000&q=80")',
            backgroundBlendMode: 'overlay',
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
          }}
        >
            <img className="h-40 w-40"  src={profile_image_url}></img>
            <div>
                {name}
            </div>
        </div>
    )
} 