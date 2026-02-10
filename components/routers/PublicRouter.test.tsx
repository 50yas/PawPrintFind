import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PublicRouter } from './PublicRouter';
import React from 'react';

// Mock child components
vi.mock('../Home', () => ({ Home: () => <div data-testid="home">Home</div> }));
vi.mock('../PressKit', () => ({ PressKit: () => <div data-testid="press-kit">PressKit</div> }));
vi.mock('../Donors', () => ({ Donors: () => <div data-testid="donors">Donors</div> }));
vi.mock('../Blog', () => ({ Blog: () => <div data-testid="blog">Blog</div> }));
vi.mock('../BlogPostDetail', () => ({ BlogPostDetail: () => <div data-testid="blog-post-detail">BlogPostDetail</div> }));
vi.mock('../AdoptionCenter', () => ({ AdoptionCenter: () => <div data-testid="adoption-center">AdoptionCenter</div> }));
vi.mock('../PaymentSuccess', () => ({ PaymentSuccess: () => <div data-testid="payment-success">PaymentSuccess</div> }));

describe('PublicRouter', () => {
    const defaultProps = {
        currentView: 'home' as any,
        setView: vi.fn(),
        lostPets: [],
        petsForAdoption: [],
        donations: [],
        selectedPost: null,
        setSelectedPost: vi.fn(),
        handleStartChat: vi.fn().mockResolvedValue(undefined),
        setIsLoginModalOpen: vi.fn(),
        isLoading: false,
        selectedPet: null,
        setSelectedPet: vi.fn(),
        onViewPet: vi.fn()
    };

    it('renders Home by default', async () => {
        render(<PublicRouter {...defaultProps} />);
        expect(await screen.findByTestId('home')).toBeInTheDocument();
    });

    it('renders PressKit for pressKit view', async () => {
        render(<PublicRouter {...defaultProps} currentView="pressKit" />);
        expect(await screen.findByTestId('press-kit')).toBeInTheDocument();
    });

    it('renders Donors for donors view', async () => {
        render(<PublicRouter {...defaultProps} currentView="donors" />);
        expect(await screen.findByTestId('donors')).toBeInTheDocument();
    });

    it('renders Blog for blog view', async () => {
        render(<PublicRouter {...defaultProps} currentView="blog" />);
        expect(await screen.findByTestId('blog')).toBeInTheDocument();
    });

    it('renders BlogPostDetail for blogPost view if selectedPost exists', async () => {
        const post = { id: '1', title: 'Test Post' } as any;
        render(<PublicRouter {...defaultProps} currentView="blogPost" selectedPost={post} />);
        expect(await screen.findByTestId('blog-post-detail')).toBeInTheDocument();
    });

    it('renders AdoptionCenter for adoptionCenter view', async () => {
        render(<PublicRouter {...defaultProps} currentView="adoptionCenter" />);
        expect(await screen.findByTestId('adoption-center')).toBeInTheDocument();
    });

    it('renders PaymentSuccess for paymentSuccess view', async () => {
        render(<PublicRouter {...defaultProps} currentView="paymentSuccess" />);
        expect(await screen.findByTestId('payment-success')).toBeInTheDocument();
    });
});
