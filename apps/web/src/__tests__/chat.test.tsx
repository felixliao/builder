import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { nanoid } from 'ai'
import { expect, test } from 'vitest'

import '@testing-library/jest-dom'

import Chat, { ChatProps } from '@/components/chat/page'

const values: ChatProps = {
  app: {
    icon: '',
    name: 'test-chat',
    short_id: 'test-chat',
    opening_remarks: '',
    enable_video_interaction: false,
  },
  session: { short_id: nanoid(), api_session_id: '', name: 'chat-session' },
  mode: 'live',
}

test('test chat show the default UI', () => {
  const { getByTestId } = render(<Chat {...values} />)

  expect(getByTestId('chat-header')).toBeVisible()
  expect(getByTestId('chat-input')).toBeVisible()
  expect(getByTestId('chat-list')).toBeVisible()
})

test('test chat when enter to send msg', () => {
  // TODO: why multi textarea
  const { getAllByPlaceholderText, getAllByText } = render(<Chat {...values} />)
  const textarea = getAllByPlaceholderText('Type a message')
  const input = 'hello, to test the textarea keypress'

  fireEvent.keyPress(textarea?.[0], {
    key: 'Enter',
    code: 13,
    charCode: 13,
    target: { value: input },
  })

  // add a new message
  // expect(getAllByText(input)).toBeDefined
})
