import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import Image from 'next/image'

export const LoginAndProfile = () => {
  const { user, isSignedIn, isLoaded } = useUser()

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="bg-black text-white text-md rotate-1 font-bold py-3 px-4 mb-8 border-4 border-white transform hover:rotate-1 transition-transform mt-8">
          LOG IN
        </button>
      </SignInButton>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Link href="/profile">
          {user?.imageUrl ? (
            <Image
              width={50}
              height={50}
              src={user.imageUrl}
              alt="User avatar"
              className="rounded-full border-4 border-ish-ink"
            />
          ) : null}
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className="mt-8">
        <ContextMenuItem className="cursor-pointer">
          <SignOutButton>Log out</SignOutButton>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
