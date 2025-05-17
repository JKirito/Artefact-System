import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar, ChatSummary } from '../Sidebar';

describe('Sidebar', () => {
  it('shows placeholder when no chats', () => {
    render(
      <Sidebar
        isOpen={true}
        chats={[]}
        currentChatId=""
        onNewChat={() => {}}
        onSelectChat={() => {}}
      />
    );
    expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument();
  });

  it('calls onSelectChat when chat item clicked', () => {
    const chats: ChatSummary[] = [
      { id: '1', title: 'First' },
      { id: '2', title: 'Second' },
    ];
    const onSelect = vi.fn();
    render(
      <Sidebar
        isOpen={true}
        chats={chats}
        currentChatId="1"
        onNewChat={() => {}}
        onSelectChat={onSelect}
      />
    );
    fireEvent.click(screen.getByText('Second'));
    expect(onSelect).toHaveBeenCalledWith('2');
  });
});
